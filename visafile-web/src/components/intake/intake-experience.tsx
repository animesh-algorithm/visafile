"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Clock3,
  FileCheck2,
  Home,
  Info,
  Menu,
  Save,
  Send,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Brand } from "@/components/brand";
import { IntakeField } from "@/components/intake/intake-field";
import { IntakeReview } from "@/components/intake/intake-review";
import {
  ClearDraftDialog,
  LoadingState,
  SuccessState,
} from "@/components/intake/intake-shell-states";
import { SupabaseAuthPanel } from "@/components/intake/supabase-auth-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { hasValue } from "@/lib/intake-answer";
import {
  allFields,
  isFieldVisible,
  stages,
  type Answer,
  type Answers,
} from "@/lib/intake-definition";
import {
  clearIntakeDraft,
  loadIntakeDraft,
  saveIntakeDraft,
} from "@/lib/intake-draft";
import { createLocalhostPrefillAnswers } from "@/lib/local-prefill";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "saving" | "saved" | "error";
type SubmissionState = "idle" | "submitting" | "submitted" | "error";

export function IntakeExperience() {
  const [answers, setAnswers] = React.useState<Answers>({});
  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [hydrated, setHydrated] = React.useState(false);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [completed, setCompleted] = React.useState(false);
  const [mobileNav, setMobileNav] = React.useState(false);
  const [canPrefill, setCanPrefill] = React.useState(false);
  const [prefillEnabled, setPrefillEnabled] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [authMessage, setAuthMessage] = React.useState<string | null>(null);
  const [submissionState, setSubmissionState] =
    React.useState<SubmissionState>("idle");
  const [submissionMessage, setSubmissionMessage] = React.useState<
    string | null
  >(null);
  const [submissionId, setSubmissionId] = React.useState<string | null>(null);
  const [authorizeOfficialSubmission, setAuthorizeOfficialSubmission] =
    React.useState(false);
  const firstFieldRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const draft = loadIntakeDraft();
        if (draft) {
          setAnswers(draft.answers);
          setStep(Math.min(draft.step, stages.length - 1));
        }
      } catch {
        setSaveState("error");
      }
      setCanPrefill(window.location.hostname === "localhost");
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => {
      try {
        saveIntakeDraft(answers, step);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [answers, step, hydrated]);

  React.useEffect(() => {
    if (!supabase) return;
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const currentStage = stages[step];
  const visibleFields = currentStage.groups
    .flatMap((group) => group.fields)
    .filter((field) => isFieldVisible(field, answers));
  const answeredCount = allFields.filter(
    (field) => isFieldVisible(field, answers) && hasValue(answers[field.id]),
  ).length;
  const visibleCount = allFields.filter((field) =>
    isFieldVisible(field, answers),
  ).length;
  const overallProgress =
    currentStage.id === "review"
      ? 100
      : Math.round((answeredCount / Math.max(1, visibleCount)) * 100);
  const sectionAnswered = visibleFields.filter((field) =>
    hasValue(answers[field.id]),
  ).length;
  const sectionProgress =
    currentStage.id === "review"
      ? 100
      : Math.round((sectionAnswered / Math.max(1, visibleFields.length)) * 100);

  function updateAnswer(id: string, value: Answer) {
    setSaveState("saving");
    setAnswers((previous) => ({ ...previous, [id]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }

  function validateCurrent() {
    const nextErrors: Record<string, string> = {};
    for (const field of visibleFields) {
      const value = answers[field.id];
      if (field.required && !hasValue(value))
        nextErrors[field.id] = "Please answer this question before continuing.";
      if (
        field.kind === "email" &&
        typeof value === "string" &&
        value &&
        !/^\S+@\S+\.\S+$/.test(value)
      )
        nextErrors[field.id] = "Enter a complete email address.";
      if (
        field.kind === "date" &&
        typeof value === "string" &&
        value &&
        Number.isNaN(Date.parse(value))
      )
        nextErrors[field.id] = "Enter a valid date.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      window.setTimeout(
        () =>
          document
            .querySelector<HTMLElement>("[data-field-error='true']")
            ?.focus(),
        0,
      );
      return false;
    }
    return true;
  }

  function validateAllRequiredAnswers() {
    const nextErrors: Record<string, string> = {};
    const firstMissingStage = stages.findIndex((stage) => {
      const missingField = stage.groups
        .flatMap((group) => group.fields)
        .filter((field) => isFieldVisible(field, answers))
        .find((field) => field.required && !hasValue(answers[field.id]));

      if (missingField) {
        nextErrors[missingField.id] =
          "Please answer this question before submitting.";
      }
      return Boolean(missingField);
    });

    setErrors(nextErrors);
    if (firstMissingStage >= 0) {
      setStep(firstMissingStage);
      setMobileNav(false);
      window.setTimeout(
        () =>
          document
            .querySelector<HTMLElement>("[data-field-error='true']")
            ?.focus(),
        0,
      );
      return false;
    }
    return true;
  }

  function goTo(next: number, validate = false) {
    if (validate && !validateCurrent()) return;
    setErrors({});
    setSaveState("saving");
    setStep(Math.max(0, Math.min(next, stages.length - 1)));
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => firstFieldRef.current?.focus(), 300);
  }

  function clearDraft() {
    clearIntakeDraft();
    setAnswers({});
    setStep(0);
    setErrors({});
    setCompleted(false);
    setPrefillEnabled(false);
    setSaveState("idle");
    setSubmissionState("idle");
    setSubmissionMessage(null);
    setSubmissionId(null);
    setAuthorizeOfficialSubmission(false);
  }

  function toggleLocalPrefill(checked: boolean) {
    setPrefillEnabled(checked);
    setCompleted(false);
    setErrors({});
    setSaveState("saving");
    if (checked) {
      setAnswers(createLocalhostPrefillAnswers());
      setStep(0);
      return;
    }
    setAnswers({});
    setStep(0);
  }

  async function submitIntake() {
    setSubmissionMessage(null);
    if (!supabase || !isSupabaseConfigured) {
      setSubmissionState("error");
      setSubmissionMessage(
        "We can’t submit your intake right now. Please try again later.",
      );
      return;
    }
    if (!user) {
      setSubmissionState("error");
      setSubmissionMessage("Sign in before submitting this intake.");
      return;
    }
    if (!validateAllRequiredAnswers()) return;

    setSubmissionState("submitting");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setSubmissionState("error");
      setSubmissionMessage(
        "Your session expired. Sign in again before submitting.",
      );
      return;
    }
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers, authorizeOfficialSubmission }),
      });
      const result = (await response.json()) as {
        applicationId?: string;
        error?: string;
      };
      if (!response.ok || !result.applicationId) {
        throw new Error(
          result.error || "Something went wrong. Please try again.",
        );
      }
      setSubmissionId(result.applicationId);
      setSubmissionState("submitted");
      setCompleted(true);
    } catch (error) {
      setSubmissionState("error");
      setSubmissionMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  if (!hydrated) return <LoadingState />;
  if (completed)
    return (
      <SuccessState
        onReview={() => setCompleted(false)}
        onRestart={clearDraft}
        submissionId={submissionId}
        authorizeOfficialSubmission={authorizeOfficialSubmission}
      />
    );

  return (
    <div className="min-h-screen bg-[var(--surface-soft)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-17 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <Brand />
          <div
            className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]"
            role="status"
            aria-live="polite"
          >
            {saveState === "saving" ? (
              <>
                <Save className="size-4" />
                Saving…
              </>
            ) : saveState === "error" ? (
              <span className="text-[var(--error)]">Couldn’t save changes</span>
            ) : (
              <>
                <Check className="size-4 text-[var(--success)]" />
                Saved on this device
              </>
            )}
            <Tooltip content="Your answers are saved on this device while you work. Sign in before sending them for review.">
              <button
                className="grid size-9 place-items-center rounded-full hover:bg-[var(--surface-soft)]"
                aria-label="About saving your answers"
              >
                <CircleHelp className="size-4" />
              </button>
            </Tooltip>
          </div>
        </div>
        <Progress
          value={overallProgress}
          className="h-1 rounded-none"
          label="Overall application progress"
        />
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-[1440px] lg:grid-cols-[290px_1fr]">
        <aside
          className={cn(
            "fixed inset-x-0 top-[72px] z-30 h-[calc(100vh-72px)] overflow-y-auto border-r border-[var(--border)] bg-white p-5 transition-transform lg:sticky lg:top-[72px] lg:block lg:translate-x-0",
            mobileNav ? "translate-x-0" : "-translate-x-full",
          )}
          aria-label="Application sections"
        >
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <p className="font-extrabold">Application sections</p>
            <button
              onClick={() => setMobileNav(false)}
              className="grid size-10 place-items-center rounded-full bg-[var(--surface-soft)]"
              aria-label="Close section navigation"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="rounded-2xl bg-[var(--cream)] p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[var(--yellow)]">
                <FileCheck2 className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--muted)]">
                  YOUR INTAKE
                </p>
                <p className="text-sm font-extrabold">
                  {overallProgress}% complete
                </p>
              </div>
            </div>
          </div>
          <ol className="mt-5 space-y-1">
            {stages.map((stage, index) => {
              const active = index === step;
              const past = index < step;
              return (
                <li key={stage.id}>
                  <button
                    type="button"
                    onClick={() => goTo(index)}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition",
                      active && "bg-[var(--sky)] text-[var(--primary-deep)]",
                      !active && "hover:bg-[var(--surface-soft)]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full border text-xs",
                        active &&
                          "border-[var(--primary)] bg-[var(--primary)] text-white",
                        past &&
                          !active &&
                          "border-[var(--mint-strong)] bg-[var(--mint)] text-[var(--success)]",
                      )}
                    >
                      {past ? <Check className="size-3.5" /> : index + 1}
                    </span>
                    {stage.shortTitle}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-7 border-t border-[var(--border)] pt-5">
            <SupabaseAuthPanel
              supabase={supabase}
              user={user}
              onMessage={setAuthMessage}
            />
            {authMessage && (
              <p className="mt-3 rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--muted)]">
                {authMessage}
              </p>
            )}
          </div>
          <div className="mt-5 border-t border-[var(--border)] pt-5">
            <ClearDraftDialog onClear={clearDraft} />
            <Link
              href="/"
              className="mt-2 flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-[var(--muted)] hover:bg-[var(--surface-soft)]"
            >
              <Home className="size-4" />
              Back to home
            </Link>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="border-b border-[var(--border)] bg-white px-4 py-4 lg:hidden">
            <button
              onClick={() => setMobileNav(true)}
              className="flex w-full items-center justify-between rounded-xl bg-[var(--surface-soft)] px-4 py-3 text-sm font-bold"
            >
              <span className="flex items-center gap-2">
                <Menu className="size-4" />
                {currentStage.shortTitle}
              </span>
              <span>
                {step + 1} of {stages.length}
              </span>
            </button>
          </div>
          <div className="mx-auto max-w-3xl px-5 py-9 sm:px-8 sm:py-14">
            <div className="mb-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="eyebrow text-[var(--primary)]">
                  Section {step + 1} of {stages.length}
                </p>
                <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--muted)]">
                  <Clock3 className="size-4" />
                  About {currentStage.time}
                </span>
              </div>
              <h1
                ref={firstFieldRef}
                tabIndex={-1}
                className="display mt-3 text-4xl leading-tight tracking-[-.035em] outline-none sm:text-5xl"
              >
                {currentStage.title}
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
                {currentStage.description}
              </p>
              {canPrefill && (
                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm shadow-[var(--shadow-soft)]">
                  <Input
                    type="checkbox"
                    checked={prefillEnabled}
                    onChange={(event) =>
                      toggleLocalPrefill(event.target.checked)
                    }
                    className="mt-0.5 size-5 shrink-0 rounded-md p-0 accent-[var(--primary)]"
                  />
                  <span>
                    <span className="block font-extrabold">
                      Fill with sample answers
                    </span>
                    <span className="mt-1 block leading-5 text-[var(--muted)]">
                      This fills your draft with example answers so you can try
                      the intake without typing everything yourself. It does not
                      submit anything.
                    </span>
                  </span>
                </label>
              )}
              <div className="mt-6 flex items-center gap-3">
                <Progress
                  value={sectionProgress}
                  className="max-w-xs flex-1"
                  label={`${currentStage.shortTitle} progress`}
                />
                <span className="text-xs font-bold text-[var(--muted)]">
                  {sectionProgress}%
                </span>
              </div>
            </div>

            {currentStage.id === "review" ? (
              <>
                <IntakeReview
                  answers={answers}
                  onEdit={goTo}
                  canSubmit={Boolean(supabase && user)}
                />
                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)]">
                  <Input
                    type="checkbox"
                    checked={authorizeOfficialSubmission}
                    onChange={(event) =>
                      setAuthorizeOfficialSubmission(event.target.checked)
                    }
                    className="mt-0.5 size-5 shrink-0 rounded-md p-0 accent-[var(--primary)]"
                  />
                  <span className="text-sm">
                    <span className="block font-extrabold">
                      Authorize final CEAC submission after review and CAPTCHA
                    </span>
                    <span className="mt-1 block leading-5 text-[var(--muted)]">
                      Leave this unchecked to have VisaFile prepare the form and
                      stop before the irreversible government submission step.
                    </span>
                  </span>
                </label>
              </>
            ) : (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  goTo(step + 1, true);
                }}
                className="space-y-6"
              >
                {currentStage.groups.map((group) => (
                  <section
                    key={group.title}
                    className="rounded-[1.5rem] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-7"
                  >
                    <div className="mb-6 border-b border-[var(--border)] pb-5">
                      <h2 className="text-xl font-extrabold tracking-[-.02em]">
                        {group.title}
                      </h2>
                      {group.description && (
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          {group.description}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
                      {group.fields
                        .filter((field) => isFieldVisible(field, answers))
                        .map((field) => (
                          <IntakeField
                            key={field.id}
                            field={field}
                            value={answers[field.id]}
                            error={errors[field.id]}
                            onChange={(value) => updateAnswer(field.id, value)}
                          />
                        ))}
                    </div>
                  </section>
                ))}
              </form>
            )}

            {Object.keys(errors).length > 0 && (
              <div
                role="alert"
                className="mt-6 flex gap-3 rounded-2xl bg-[var(--error-soft)] p-4 text-sm text-[var(--error)]"
              >
                <Info className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-extrabold">
                    A few answers need your attention.
                  </p>
                  <p className="mt-1">
                    We highlighted {Object.keys(errors).length}{" "}
                    {Object.keys(errors).length === 1
                      ? "question"
                      : "questions"}{" "}
                    above.
                  </p>
                </div>
              </div>
            )}

            {submissionMessage && (
              <div
                role="alert"
                className={cn(
                  "mt-6 rounded-2xl p-4 text-sm font-bold",
                  submissionState === "error"
                    ? "bg-[var(--error-soft)] text-[var(--error)]"
                    : "bg-[var(--mint)] text-[var(--success)]",
                )}
              >
                {submissionMessage}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-6">
              <Button
                type="button"
                variant="ghost"
                disabled={step === 0}
                onClick={() => goTo(step - 1)}
              >
                <ArrowLeft className="size-4" />
                Previous
              </Button>
              {currentStage.id === "review" ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={submitIntake}
                  disabled={submissionState === "submitting"}
                >
                  {submissionState === "submitting"
                    ? "Starting automation..."
                    : authorizeOfficialSubmission
                      ? "Start and submit"
                      : "Prepare DS-160"}
                  <Send className="size-5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => goTo(step + 1, true)}
                >
                  Save & continue <ArrowRight className="size-5" />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
