import Link from "next/link";
import { Dialog } from "radix-ui";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClearDraftDialog({ onClear }: { onClear: () => void }) {
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

export function LoadingState() {
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

export function SuccessState({
  onReview,
  onRestart,
  submissionId,
  authorizeOfficialSubmission,
}: {
  onReview: () => void;
  onRestart: () => void;
  submissionId?: string | null;
  authorizeOfficialSubmission: boolean;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--primary)] px-5 py-12 text-white">
      <div className="w-full max-w-2xl text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-[var(--yellow)] text-[var(--ink)]">
          <CheckCircle2 className="size-10" />
        </span>
        <p className="eyebrow mt-7 text-[var(--yellow)]">
          Prototype intake complete
        </p>
        <h1 className="display mt-3 text-5xl leading-tight tracking-[-.04em] sm:text-6xl">
          Your automation is queued.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/75">
          {authorizeOfficialSubmission
            ? "Automation has started. VisaFile will pause whenever your input is required, including CAPTCHA."
            : "Automation has started in prepare-only mode and will stop before the official government submission step."}
        </p>
        {submissionId && (
          <p className="mx-auto mt-5 inline-flex max-w-full rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/80">
            Saved for follow-up
          </p>
        )}
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          {submissionId && (
            <Button asChild variant="light" size="lg">
              <Link href={`/applications/${submissionId}`}>
                Track automation
              </Link>
            </Button>
          )}
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
