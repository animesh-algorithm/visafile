"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Send,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";

type Status =
  | "queueing"
  | "queued"
  | "filling"
  | "awaiting_captcha"
  | "awaiting_correction"
  | "submitting"
  | "completed"
  | "failed";

interface CorrectionError {
  message: string;
  field?: string;
  schemaPath?: string;
  kind?: "text" | "select" | "radio" | "checkbox";
}

interface ApplicationState {
  applicationId: string;
  status: Status;
  error: string | null;
  authorizeOfficialSubmission: boolean;
  pendingInteraction:
    | { type: "captcha"; imageBase64: string }
    | { type: "correction"; errors: CorrectionError[] }
    | null;
  hasPdf: boolean;
}

function workerErrorCopy(error: string | null) {
  if (!error) {
    return "No additional error detail is available.";
  }

  if (/cloudflare|attention required/i.test(error)) {
    return "CEAC showed a browser security check before the form loaded. VisaFile can only ask for the official CAPTCHA after that page is available. On this computer, restart the worker with HEADLESS=false, complete the check in Chrome, then return here for CAPTCHA.";
  }

  return error;
}

const STATUS_COPY: Record<
  Status,
  { label: string; detail: string; progress: number }
> = {
  queueing: {
    label: "Starting automation",
    detail: "Your intake is saved and the automation job is being created.",
    progress: 5,
  },
  queued: {
    label: "Waiting for the worker",
    detail:
      "Your application is safely queued. You can leave this page and return later.",
    progress: 12,
  },
  filling: {
    label: "Completing the DS-160",
    detail: "VisaFile is entering your reviewed answers on the official form.",
    progress: 55,
  },
  awaiting_captcha: {
    label: "Your help is needed",
    detail: "Enter the CAPTCHA shown below so automation can continue.",
    progress: 72,
  },
  awaiting_correction: {
    label: "A correction is needed",
    detail: "CEAC rejected one or more values. Correct them below to continue.",
    progress: 76,
  },
  submitting: {
    label: "Submitting to CEAC",
    detail:
      "VisaFile is verifying the final step. Please do not start another submission.",
    progress: 92,
  },
  completed: {
    label: "Automation complete",
    detail: "The worker reached its configured stopping point successfully.",
    progress: 100,
  },
  failed: {
    label: "Automation stopped",
    detail:
      "Your answers remain saved. Review the issue below before retrying.",
    progress: 100,
  },
};

export function ApplicationTracker({
  applicationId,
}: {
  applicationId: string;
}) {
  const [state, setState] = React.useState<ApplicationState | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [captcha, setCaptcha] = React.useState("");
  const [corrections, setCorrections] = React.useState<Record<number, string>>(
    {},
  );
  const [pending, setPending] = React.useState(false);

  const authenticatedFetch = React.useCallback(
    async (url: string, init?: RequestInit) => {
      const { data } = await supabase!.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in again to view this application.");
      return fetch(url, {
        ...init,
        headers: { ...init?.headers, Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    },
    [],
  );

  const refresh = React.useCallback(async () => {
    if (!supabase) {
      setMessage("VisaFile sign-in is not configured.");
      return;
    }
    try {
      const response = await authenticatedFetch(
        `/api/applications/${applicationId}`,
      );
      const body = (await response.json()) as ApplicationState & {
        error?: string;
      };
      if (!response.ok) throw new Error(body.error || "Status is unavailable.");
      setState(body);
      setMessage(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Status is unavailable.",
      );
    }
  }, [applicationId, authenticatedFetch]);

  React.useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => void refresh(), 4_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [refresh]);

  async function sendAction(body: Record<string, unknown>) {
    setPending(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `/api/applications/${applicationId}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "The response was not accepted.");
      setCaptcha("");
      setCorrections({});
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The response was not accepted.",
      );
    } finally {
      setPending(false);
    }
  }

  async function downloadPdf() {
    setPending(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `/api/applications/${applicationId}/pdf`,
      );
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(result.error || "The confirmation PDF is unavailable.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `ds160-${applicationId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The confirmation PDF is unavailable.",
      );
    } finally {
      setPending(false);
    }
  }

  const copy = state ? STATUS_COPY[state.status] : null;
  const correctionErrors =
    state?.pendingInteraction?.type === "correction"
      ? state.pendingInteraction.errors
      : [];

  return (
    <main className="min-h-screen bg-[var(--surface-soft)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex h-18 max-w-5xl items-center justify-between px-5">
          <Brand />
          <Link
            href="/intake"
            className="text-sm font-bold text-[var(--primary)]"
          >
            Back to intake
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <p className="eyebrow text-[var(--primary)]">Application progress</p>
        <h1 className="display mt-3 text-4xl sm:text-5xl">
          {copy?.label ?? "Loading your application"}
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          {copy?.detail ?? "Checking the latest worker status…"}
        </p>
        <Progress
          value={copy?.progress ?? 5}
          className="mt-7 h-2"
          label="Automation progress"
        />

        <section className="mt-8 rounded-[1.5rem] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-7">
          {!state ? (
            <div className="flex items-center gap-3 text-sm font-bold text-[var(--muted)]">
              <LoaderCircle className="size-5 animate-spin" /> Checking status…
            </div>
          ) : state.status === "awaiting_captcha" &&
            state.pendingInteraction?.type === "captcha" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendAction({ type: "captcha", answer: captcha });
              }}
            >
              <div className="flex items-start gap-3 rounded-2xl bg-[var(--sky)] p-4 text-sm">
                <LockKeyhole className="mt-0.5 size-5 shrink-0 text-[var(--primary)]" />
                <p>
                  CAPTCHA stays human-controlled. VisaFile does not solve or
                  bypass it.
                </p>
              </div>
              {/* The image comes from the authenticated worker status for this application. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${state.pendingInteraction.imageBase64}`}
                alt="CEAC CAPTCHA challenge"
                className="mt-5 max-w-full rounded-xl border border-[var(--border)]"
              />
              <label
                htmlFor="captcha"
                className="mt-5 block text-sm font-extrabold"
              >
                Characters shown
              </label>
              <Input
                id="captcha"
                value={captcha}
                onChange={(event) => setCaptcha(event.target.value)}
                required
                autoComplete="off"
                className="mt-2"
              />
              <Button
                type="submit"
                disabled={pending || !captcha.trim()}
                className="mt-4"
              >
                Continue automation <Send className="size-4" />
              </Button>
            </form>
          ) : state.status === "awaiting_correction" &&
            correctionErrors.length ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendAction({
                  type: "corrections",
                  corrections: correctionErrors.map((error, index) => ({
                    target: error.field,
                    value: corrections[index] ?? "",
                    kind: error.kind,
                  })),
                });
              }}
            >
              <div className="space-y-5">
                {correctionErrors.map((error, index) => (
                  <div key={`${error.field}-${index}`}>
                    <label
                      htmlFor={`correction-${index}`}
                      className="block text-sm font-extrabold"
                    >
                      {error.schemaPath || error.message}
                    </label>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {error.message}
                    </p>
                    <Input
                      id={`correction-${index}`}
                      value={corrections[index] ?? ""}
                      onChange={(event) =>
                        setCorrections((current) => ({
                          ...current,
                          [index]: event.target.value,
                        }))
                      }
                      required
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
              <Button
                type="submit"
                disabled={
                  pending ||
                  correctionErrors.some(
                    (_, index) => !corrections[index]?.trim(),
                  )
                }
                className="mt-5"
              >
                Send corrections <Send className="size-4" />
              </Button>
            </form>
          ) : state.status === "completed" ? (
            <div>
              <div className="flex items-start gap-3 text-[var(--success)]">
                <CheckCircle2 className="size-6 shrink-0" />
                <p className="font-extrabold">
                  {state.authorizeOfficialSubmission
                    ? "The filing workflow completed."
                    : "Your DS-160 was prepared and stopped before official submission."}
                </p>
              </div>
              {state.hasPdf && (
                <Button
                  type="button"
                  onClick={() => void downloadPdf()}
                  disabled={pending}
                  className="mt-5"
                >
                  <Download className="size-4" /> Download confirmation PDF
                </Button>
              )}
            </div>
          ) : state.status === "failed" ? (
            <div className="flex items-start gap-3 text-[var(--error)]">
              <AlertTriangle className="size-6 shrink-0" />
              <div>
                <p className="font-extrabold">The worker stopped safely.</p>
                <p className="mt-2 text-sm leading-6">
                  {workerErrorCopy(state.error)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm font-bold text-[var(--muted)]">
              <LoaderCircle className="size-5 animate-spin text-[var(--primary)]" />{" "}
              No action is needed right now.
            </div>
          )}
        </section>

        {message && (
          <div
            role="alert"
            className="mt-5 rounded-2xl bg-[var(--error-soft)] p-4 text-sm font-bold text-[var(--error)]"
          >
            {message}
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => void refresh()}
          className="mt-5"
        >
          <RefreshCw className="size-4" /> Refresh status
        </Button>
        <p className="mt-8 text-xs leading-5 text-[var(--muted)]">
          VisaFile is not affiliated with the U.S. government and does not
          guarantee visa approval. Closing this page does not cancel a queued
          job.
        </p>
      </div>
    </main>
  );
}
