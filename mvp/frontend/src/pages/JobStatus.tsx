import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJob, getWsUrl, pdfUrl } from "../api";
import { SchemaPathField } from "../components/SchemaForm";
import {
  CEAC_FIELD_BINDINGS,
  matchCeacError,
  readPath,
  writePath,
  type CeacFieldBinding,
} from "@shared/ceac-field-map";
import { friendlyCeacMessage, STATUS_LABELS } from "../schema/fieldMeta";
import type {
  FieldCorrection,
  JobStatus as Status,
  JobWsMessage,
  ValidationErrorItem,
} from "../types";

const STATUS_ORDER: Status[] = [
  "queued",
  "filling",
  "awaiting_browser_check",
  "awaiting_captcha",
  "awaiting_correction",
  "submitting",
  "completed",
  "failed",
];

interface CorrectionRow {
  message: string;
  binding: CeacFieldBinding | null;
  /** Free-form target when no schema binding */
  fallbackTarget: string;
  value: unknown;
  original: unknown;
}

export function JobStatusPage() {
  const { jobId = "" } = useParams();
  const [status, setStatus] = useState<Status | "connecting">("connecting");
  const [detail, setDetail] = useState<string | undefined>();
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [correctionRows, setCorrectionRows] = useState<CorrectionRow[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [failError, setFailError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const progressIndex = useMemo(() => {
    if (status === "connecting") return -1;
    return STATUS_ORDER.indexOf(status);
  }, [status]);

  const statusLabel = STATUS_LABELS[status] ?? status;
  const awaitingBrowserSecurity =
    status === "awaiting_browser_check" ||
    (status === "awaiting_captcha" && detail && !captchaImage);

  useEffect(() => {
    if (!jobId) return;
    getJob(jobId)
      .then((job) => {
        setStatus(job.status);
        if (job.payload) {
          setPayload(job.payload as unknown as Record<string, unknown>);
        }
        if (job.error) setFailError(job.error);
      })
      .catch((e) => setFailError(e.message));

    const socket = new WebSocket(getWsUrl(jobId));
    setWs(socket);

    socket.onopen = () => setLog((l) => [...l, "WebSocket connected"]);
    socket.onclose = () => setLog((l) => [...l, "WebSocket closed"]);
    socket.onerror = () => setLog((l) => [...l, "WebSocket error"]);
    socket.onmessage = (ev) => {
      setLog((l) => [...l, `← ${ev.data}`]);
      let msg: JobWsMessage;
      try {
        msg = JSON.parse(String(ev.data)) as JobWsMessage;
      } catch {
        return;
      }
      if (msg.type === "status") {
        setStatus(msg.status);
        setDetail(msg.detail);
      } else if (msg.type === "captcha-needed") {
        setStatus("awaiting_captcha");
        setCaptchaImage(`data:image/png;base64,${msg.imageBase64}`);
      } else if (msg.type === "correction-needed") {
        setStatus("awaiting_correction");
        setCorrectionRows((prev) =>
          buildCorrectionRows(msg.errors, payload, prev),
        );
        getJob(jobId).then((job) => {
          if (job.payload) {
            const p = job.payload as unknown as Record<string, unknown>;
            setPayload(p);
            setCorrectionRows(buildCorrectionRows(msg.errors, p, []));
          }
        });
      } else if (msg.type === "completed") {
        setStatus("completed");
        setDownloadUrl(
          msg.downloadUrl.startsWith("http")
            ? msg.downloadUrl
            : pdfUrl(jobId),
        );
      } else if (msg.type === "failed") {
        setStatus("failed");
        setFailError(msg.error);
      }
    };

    return () => {
      socket.close();
    };
  }, [jobId]);

  function send(message: JobWsMessage) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setFailError("WebSocket is not connected");
      return;
    }
    const body = JSON.stringify(message);
    ws.send(body);
    setLog((l) => [...l, `→ ${body}`]);
  }

  function submitCaptcha() {
    send({ type: "captcha-answer", answer: captchaAnswer.trim() });
    setCaptchaAnswer("");
  }

  function submitCorrections() {
    const corrections: FieldCorrection[] = [];
    let nextPayload = payload ? { ...payload } : {};

    for (const row of correctionRows) {
      if (row.binding) {
        const changed =
          JSON.stringify(row.value) !== JSON.stringify(row.original);
        if (!changed) continue;
        nextPayload = writePath(
          nextPayload,
          row.binding.schemaPath,
          row.value,
        );
        corrections.push({
          target: row.binding.target,
          value:
            typeof row.value === "boolean"
              ? row.value
                ? "true"
                : "false"
              : String(row.value ?? ""),
          kind: row.binding.kind,
          partialId: row.binding.partialId,
        });
      } else if (row.fallbackTarget) {
        corrections.push({
          target: row.fallbackTarget,
          value: String(row.value ?? ""),
          kind: "text",
          partialId: true,
        });
      }
    }

    if (corrections.length === 0) {
      setFailError("Change at least one field before submitting corrections.");
      return;
    }
    setFailError(null);
    setPayload(nextPayload);
    send({ type: "correction-answer", corrections });
    setStatus("filling");
  }

  return (
    <div className="page">
      <header className="hero compact">
        <p className="brand">DS-160 Automation</p>
        <h1>Job status</h1>
        <p className="lede">
          Job <code>{jobId}</code>
        </p>
        <p>
          <Link to="/">← Back to intake</Link>
        </p>
      </header>

      <section className="panel">
        <h2>
          Status: <span className="status-pill">{statusLabel}</span>
          {detail ? ` — ${detail}` : ""}
        </h2>
        <ol className="progress">
          {STATUS_ORDER.filter((s) => s !== "failed").map((s, i) => (
            <li
              key={s}
              className={
                status === "failed" ? "" : i <= progressIndex ? "done" : ""
              }
            >
              {STATUS_LABELS[s] ?? s}
            </li>
          ))}
        </ol>
      </section>

      {captchaImage && status === "awaiting_captcha" && (
        <section className="panel highlight">
          <h2>Enter the CAPTCHA</h2>
          <p className="hint">
            Type the characters you see in the image, then submit to continue
            filling.
          </p>
          <img src={captchaImage} alt="CAPTCHA" className="captcha" />
          <div className="actions">
            <input
              type="text"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              placeholder="Characters from the image"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCaptcha();
              }}
            />
            <button type="button" className="primary" onClick={submitCaptcha}>
              Submit CAPTCHA
            </button>
          </div>
        </section>
      )}

      {awaitingBrowserSecurity && (
        <section className="panel highlight">
          <h2>Browser security check needed</h2>
          <p className="hint">
            Complete the verification in the open Chrome window. Leave this page
            open; automation will continue automatically after CEAC loads. Once
            CEAC shows the official CAPTCHA, VisaFile will display the image and
            answer field here.
          </p>
        </section>
      )}

      {status === "awaiting_correction" && (
        <section className="panel highlight">
          <h2>Please fix these fields</h2>
          <p className="hint">
            The government site rejected some answers. Update the fields below,
            then continue — only values you change are sent.
          </p>
          {correctionRows.length === 0 && (
            <p className="hint">Waiting for field details…</p>
          )}
          {correctionRows.map((row, i) => (
            <div key={i} className="correction-row">
              <p className="correction-msg">
                {friendlyCeacMessage(row.message)}
              </p>
              {row.binding && payload ? (
                <SchemaPathField
                  schemaPath={row.binding.schemaPath}
                  rootValue={writePath(
                    payload,
                    row.binding.schemaPath,
                    row.value,
                  )}
                  onChange={(_path, value) => {
                    setCorrectionRows((rows) =>
                      rows.map((r, idx) =>
                        idx === i ? { ...r, value } : r,
                      ),
                    );
                  }}
                />
              ) : (
                <div className="field">
                  <label>Corrected value</label>
                  <input
                    type="text"
                    value={String(row.value ?? "")}
                    onChange={(e) =>
                      setCorrectionRows((rows) =>
                        rows.map((r, idx) =>
                          idx === i ? { ...r, value: e.target.value } : r,
                        ),
                      )
                    }
                    placeholder="Enter the corrected value"
                  />
                  <details className="advanced">
                    <summary>Advanced</summary>
                    <label>Form control id</label>
                    <input
                      type="text"
                      value={row.fallbackTarget}
                      onChange={(e) =>
                        setCorrectionRows((rows) =>
                          rows.map((r, idx) =>
                            idx === i
                              ? { ...r, fallbackTarget: e.target.value }
                              : r,
                          ),
                        )
                      }
                      placeholder="e.g. tbxAPP_SURNAME"
                    />
                  </details>
                </div>
              )}
            </div>
          ))}
          <div className="actions">
            <button
              type="button"
              className="primary"
              onClick={submitCorrections}
              disabled={correctionRows.length === 0}
            >
              Save &amp; continue
            </button>
          </div>
        </section>
      )}

      {status === "completed" && downloadUrl && (
        <section className="panel success">
          <h2>Completed</h2>
          <p>
            <a href={downloadUrl} target="_blank" rel="noreferrer">
              Download confirmation PDF
            </a>
          </p>
        </section>
      )}

      {(status === "failed" || failError) && (
        <section className="panel">
          <h2>Something went wrong</h2>
          <pre className="error">{failError}</pre>
        </section>
      )}

      <details className="panel event-log">
        <summary>Technical event log</summary>
        <pre className="log">{log.join("\n") || "No events yet."}</pre>
      </details>
    </div>
  );
}

function buildCorrectionRows(
  errors: ValidationErrorItem[],
  payload: Record<string, unknown> | null,
  _prev: CorrectionRow[],
): CorrectionRow[] {
  return errors.map((err) => {
    const binding =
      (err.schemaPath
        ? CEAC_FIELD_BINDINGS.find((b) => b.schemaPath === err.schemaPath)
        : null) ??
      matchCeacError(err.message) ??
      (err.field ? matchCeacError(err.field) : null);
    const original =
      binding && payload ? readPath(payload, binding.schemaPath) : "";
    let value = original;
    if (
      binding?.schemaPath ===
        "personalInformation2.nationalIdentificationNumberDoesNotApply" &&
      (original === undefined || original === false)
    ) {
      value = true;
    }
    return {
      message: err.message,
      binding,
      fallbackTarget: err.field || binding?.target || "",
      value,
      original,
    };
  });
}
