import { Pencil, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasValue } from "@/lib/intake-answer";
import {
  isFieldVisible,
  labelForAnswer,
  stages,
  type Answers,
} from "@/lib/intake-definition";
import { cn } from "@/lib/utils";

export function IntakeReview({
  answers,
  onEdit,
  canSubmit,
}: {
  answers: Answers;
  onEdit: (step: number) => void;
  canSubmit: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-2xl bg-[var(--mint)] p-4 text-sm text-[var(--success)]">
        <ShieldCheck className="size-5 shrink-0" />
        <p>
          {canSubmit ? (
            <>
              <strong>Ready to send for review.</strong> Your answers can be
              saved so you can follow up later.
            </>
          ) : (
            <>
              <strong>Review before sending.</strong> Sign in before sharing
              this draft for review.
            </>
          )}
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
                      {field.redactOnReview
                        ? "Provided"
                        : labelForAnswer(field, answers[field.id])}
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
