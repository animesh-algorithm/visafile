import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDefaultApplication } from "../defaultApplication";
import { createJob } from "../api";
import { SchemaForm } from "../components/SchemaForm";
import { validateApplicationClient } from "../schema/validateClient";
import { STEPS, type Ds160Application, type StepKey } from "../types";

export function IntakeForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [app, setApp] = useState<Ds160Application>(() =>
    createDefaultApplication(),
  );
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const current = STEPS[step];
  const validation = useMemo(
    () => validateApplicationClient(app),
    [app],
  );

  const sectionPrefix = `${current.key}.`;
  const sectionErrors = useMemo(() => {
    if (!touched) return {};
    const out: Record<string, string> = {};
    for (const [path, msg] of Object.entries(validation.byPath)) {
      if (path === current.key || path.startsWith(sectionPrefix)) {
        out[path] = msg;
      }
    }
    return out;
  }, [validation.byPath, current.key, sectionPrefix, touched]);

  function sectionHasErrors(): boolean {
    return Object.keys(sectionErrors).length > 0 ||
      Object.keys(validation.byPath).some(
        (p) => p === current.key || p.startsWith(sectionPrefix),
      );
  }

  function goNext() {
    setTouched(true);
    const result = validateApplicationClient(app);
    const hasSectionError = Object.keys(result.byPath).some(
      (p) => p === current.key || p.startsWith(sectionPrefix),
    );
    if (hasSectionError) {
      setError("Fix the highlighted fields before continuing.");
      return;
    }
    setError(null);
    setTouched(false);
    setStep((s) => s + 1);
  }

  async function onSubmit() {
    setTouched(true);
    const result = validateApplicationClient(app);
    if (!result.ok) {
      setError(
        `Form is incomplete or invalid:\n${result.errors.slice(0, 12).join("\n")}`,
      );
      // Jump to first section with an error
      const firstPath = Object.keys(result.byPath)[0];
      if (firstPath) {
        const section = firstPath.split(".")[0] as StepKey;
        const idx = STEPS.findIndex((s) => s.key === section);
        if (idx >= 0) setStep(idx);
      }
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { jobId } = await createJob(app);
      navigate(`/jobs/${jobId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  function NavActions({ placement }: { placement: "top" | "bottom" }) {
    return (
      <div className={`actions actions-${placement}`}>
        <button
          type="button"
          disabled={step === 0}
          onClick={() => {
            setTouched(false);
            setError(null);
            setStep((s) => s - 1);
          }}
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" className="primary" onClick={goNext}>
            Next
          </button>
        ) : (
          <button
            type="button"
            className="primary"
            disabled={submitting}
            onClick={onSubmit}
          >
            {submitting ? "Submitting…" : "Submit job"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="brand">DS-160 Automation</p>
        <h1>Application intake</h1>
        <p className="lede">
          Fill each section like the official DS-160. Required fields are marked
          with *; answers are checked before you move on.
        </p>
      </header>

      <nav className="steps" aria-label="Form sections">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={i === step ? "step active" : "step"}
            onClick={() => {
              setTouched(false);
              setError(null);
              setStep(i);
            }}
          >
            <span className="step-num">{i + 1}</span>
            {s.title}
          </button>
        ))}
      </nav>

      <section className="panel">
        <h2>
          Step {step + 1}: {current.title}
        </h2>
        <NavActions placement="top" />
        <SchemaForm
          sectionKey={current.key}
          value={(app[current.key] as Record<string, unknown>) ?? {}}
          errors={sectionErrors}
          onChange={(next) => {
            setApp((prev) => ({ ...prev, [current.key]: next }));
            setError(null);
          }}
        />
        {error && <pre className="error">{error}</pre>}
        <NavActions placement="bottom" />
        {touched && sectionHasErrors() && (
          <p className="hint">Resolve field errors above to continue.</p>
        )}
      </section>
    </div>
  );
}
