"use client";

import * as React from "react";
import Link from "next/link";
import { Dialog, RadioGroup } from "radix-ui";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileCheck2,
  Home,
  Info,
  LockKeyhole,
  Menu,
  Pencil,
  RotateCcw,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip } from "@/components/ui/tooltip";
import {
  allFields,
  isFieldVisible,
  labelForAnswer,
  stages,
  type Answer,
  type Answers,
  type FieldDefinition,
} from "@/lib/intake-definition";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "visafile-intake-draft-v1";
type SaveState = "idle" | "saving" | "saved" | "error";

export function IntakeExperience() {
  const [answers, setAnswers] = React.useState<Answers>({});
  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [hydrated, setHydrated] = React.useState(false);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [completed, setCompleted] = React.useState(false);
  const [mobileNav, setMobileNav] = React.useState(false);
  const firstFieldRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as {
            answers?: Answers;
            step?: number;
          };
          setAnswers(parsed.answers ?? {});
          setStep(Math.min(parsed.step ?? 0, stages.length - 1));
        }
      } catch {
        setSaveState("error");
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            version: 1,
            answers,
            step,
            updatedAt: new Date().toISOString(),
          }),
        );
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [answers, step, hydrated]);

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
    window.localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setStep(0);
    setErrors({});
    setCompleted(false);
    setSaveState("idle");
  }

  if (!hydrated) return <LoadingState />;
  if (completed)
    return (
      <SuccessState
        onReview={() => setCompleted(false)}
        onRestart={clearDraft}
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
            <Tooltip content="Your answers are saved on this device while you work. Nothing is sent while you are only filling out the draft.">
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
              <Review answers={answers} onEdit={goTo} />
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
                          <Field
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
                  onClick={() => setCompleted(true)}
                >
                  Finish review <Check className="size-5" />
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

function Field({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldDefinition;
  value?: Answer;
  error?: string;
  onChange: (value: Answer) => void;
}) {
  const errorId = `${field.id.replaceAll(".", "-")}-error`;
  const helpId = `${field.id.replaceAll(".", "-")}-help`;
  const describedBy =
    [field.helper ? helpId : "", error ? errorId : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  const invalidProps = {
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    "data-field-error": error ? "true" : undefined,
  } as const;
  return (
    <div
      className={cn(
        field.width === "full" ||
          field.kind === "yesno" ||
          field.kind === "checkbox"
          ? "sm:col-span-2"
          : "",
        error && "rounded-2xl bg-[var(--error-soft)] p-3 -m-3",
      )}
    >
      {field.kind === "yesno" ? (
        <fieldset>
          <legend className="flex items-start gap-2 text-sm font-extrabold leading-5">
            {field.label}
            <Required required={field.required} />
            {field.sensitive && (
              <LockKeyhole
                className="mt-0.5 size-3.5 text-[var(--muted)]"
                aria-label="Sensitive answer"
              />
            )}
          </legend>
          {field.helper && (
            <p
              id={helpId}
              className="mt-2 text-sm leading-5 text-[var(--muted)]"
            >
              {field.helper}
            </p>
          )}
          <RadioGroup.Root
            value={typeof value === "string" ? value : ""}
            onValueChange={onChange}
            className="mt-3 grid grid-cols-2 gap-3"
            {...invalidProps}
          >
            {["YES", "NO"].map((option) => (
              <label
                key={option}
                className={cn(
                  "flex min-h-13 cursor-pointer items-center gap-3 rounded-2xl border bg-white px-4 font-bold transition hover:border-[var(--primary)]",
                  value === option
                    ? "border-[var(--primary)] ring-2 ring-[var(--focus)]"
                    : "border-[var(--border)]",
                )}
              >
                <RadioGroup.Item
                  value={option}
                  className="grid size-5 place-items-center rounded-full border-2 border-[var(--border)] data-[state=checked]:border-[var(--primary)]"
                >
                  <RadioGroup.Indicator className="size-2.5 rounded-full bg-[var(--primary)]" />
                </RadioGroup.Item>
                {option === "YES" ? "Yes" : "No"}
              </label>
            ))}
          </RadioGroup.Root>
        </fieldset>
      ) : (
        <>
          <label
            htmlFor={field.id}
            className="flex items-center gap-2 text-sm font-extrabold"
          >
            {field.label}
            <Required required={field.required} />
            {field.sensitive && (
              <LockKeyhole
                className="size-3.5 text-[var(--muted)]"
                aria-label="Sensitive answer"
              />
            )}
          </label>
          {field.helper && (
            <p
              id={helpId}
              className="mt-1.5 text-sm leading-5 text-[var(--muted)]"
            >
              {field.helper}
            </p>
          )}
          <div className="mt-2">
            {field.kind === "select" ? (
              <Select
                id={field.id}
                value={typeof value === "string" ? value : ""}
                onChange={(event) => onChange(event.target.value)}
                {...invalidProps}
              >
                <option value="">Choose an answer</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            ) : field.kind === "textarea" || field.kind === "list" ? (
              <Textarea
                id={field.id}
                value={typeof value === "string" ? value : ""}
                placeholder={field.placeholder}
                onChange={(event) => onChange(event.target.value)}
                {...invalidProps}
              />
            ) : (
              <Input
                id={field.id}
                type={field.kind === "date" ? "date" : field.kind}
                value={typeof value === "string" ? value : ""}
                placeholder={field.placeholder}
                onChange={(event) => onChange(event.target.value)}
                autoComplete="off"
                {...invalidProps}
              />
            )}
          </div>
        </>
      )}
      {error && (
        <p id={errorId} className="mt-2 text-sm font-bold text-[var(--error)]">
          {error}
        </p>
      )}
    </div>
  );
}

function Required({ required }: { required?: boolean }) {
  return required ? (
    <span className="text-[var(--error)]" aria-label="required">
      *
    </span>
  ) : (
    <span className="text-xs font-medium text-[var(--muted)]">Optional</span>
  );
}

function Review({
  answers,
  onEdit,
}: {
  answers: Answers;
  onEdit: (step: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-2xl bg-[var(--mint)] p-4 text-sm text-[var(--success)]">
        <ShieldCheck className="size-5 shrink-0" />
        <p>
          <strong>Nothing will be submitted.</strong> This screen only checks
          the answers saved on this device.
        </p>
      </div>
      {stages.slice(0, -1).map((stage, stageIndex) => {
        const fields = stage.groups
          .flatMap((group) => group.fields)
          .filter((field) => isFieldVisible(field, answers));
        const missing = fields.filter(
          (field) => field.required && !hasValue(answers[field.id]),
        ).length;
        return (
          <section
            key={stage.id}
            className="overflow-hidden rounded-[1.5rem] bg-white shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-7">
              <div>
                <h2 className="font-extrabold">{stage.shortTitle}</h2>
                <p
                  className={cn(
                    "mt-1 text-xs font-bold",
                    missing ? "text-[var(--warning)]" : "text-[var(--success)]",
                  )}
                >
                  {missing
                    ? `${missing} required ${missing === 1 ? "answer" : "answers"} missing`
                    : "Ready to review"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(stageIndex)}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            </div>
            <dl className="grid gap-x-8 px-5 py-4 sm:grid-cols-2 sm:px-7">
              {fields
                .filter((field) => hasValue(answers[field.id]))
                .slice(0, 8)
                .map((field) => (
                  <div
                    key={field.id}
                    className="border-b border-[var(--border)] py-3 last:border-0"
                  >
                    <dt className="text-xs font-bold text-[var(--muted)]">
                      {field.label}
                    </dt>
                    <dd className="mt-1 break-words text-sm font-bold">
                      {labelForAnswer(field, answers[field.id])}
                    </dd>
                  </div>
                ))}
              {fields.every((field) => !hasValue(answers[field.id])) && (
                <p className="py-3 text-sm text-[var(--muted)]">
                  No answers yet.
                </p>
              )}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

function ClearDraftDialog({ onClear }: { onClear: () => void }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-[var(--muted)] hover:bg-[var(--error-soft)] hover:text-[var(--error)]">
          <RotateCcw className="size-4" />
          Start over
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--ink)]/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-[1.5rem] bg-white p-6 shadow-2xl">
          <Dialog.Title className="display text-3xl">
            Clear your draft?
          </Dialog.Title>
          <Dialog.Description className="mt-3 leading-6 text-[var(--muted)]">
            This removes every answer saved by VisaFile in this browser. This
            cannot be undone.
          </Dialog.Description>
          <div className="mt-7 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="secondary">Keep draft</Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button
                onClick={onClear}
                className="bg-[var(--error)] shadow-none hover:bg-[var(--error)]"
              >
                Clear draft
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[var(--surface-soft)]">
      <div className="h-18 border-b border-[var(--border)] bg-white" />
      <div className="mx-auto max-w-3xl animate-pulse px-5 py-16">
        <div className="h-3 w-28 rounded bg-[var(--border)]" />
        <div className="mt-5 h-12 w-3/4 rounded-xl bg-[var(--border)]" />
        <div className="mt-8 h-80 rounded-[1.5rem] bg-white" />
      </div>
      <span className="sr-only">Loading your saved draft</span>
    </div>
  );
}

function SuccessState({
  onReview,
  onRestart,
}: {
  onReview: () => void;
  onRestart: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--primary)] px-5 py-12 text-white">
      <div className="w-full max-w-2xl text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-[var(--yellow)] text-[var(--ink)]">
          <CheckCircle2 className="size-10" />
        </span>
        <p className="eyebrow mt-7 text-[var(--yellow)]">
          Intake review complete
        </p>
        <h1 className="display mt-3 text-5xl leading-tight tracking-[-.04em] sm:text-6xl">
          Your answers are ready for review.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/75">
          No DS-160 was submitted. VisaFile pauses before any official filing
          step so you can review what happens next.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="light" size="lg" onClick={onReview}>
            Review answers
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onRestart}
            className="border-white/30 bg-transparent text-white ring-white/30 hover:bg-white/10"
          >
            Start a new draft
          </Button>
        </div>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to VisaFile home
        </Link>
      </div>
    </main>
  );
}

function hasValue(value: Answer | undefined) {
  return Array.isArray(value)
    ? value.length > 0
    : value !== undefined && value !== "" && value !== false;
}
