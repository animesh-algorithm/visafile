import { RadioGroup } from "radix-ui";
import { LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Answer, FieldDefinition } from "@/lib/intake-definition";
import { cn } from "@/lib/utils";

export function IntakeField({
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
  const selectedYesNo = field.yesNoValues
    ? (Object.entries(field.yesNoValues).find(
        ([, mappedValue]) => mappedValue === value,
      )?.[0] ?? "")
    : typeof value === "string"
      ? value
      : "";

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
        <YesNoField
          field={field}
          helpId={helpId}
          selectedYesNo={selectedYesNo}
          invalidProps={invalidProps}
          onChange={onChange}
        />
      ) : (
        <StandardField
          field={field}
          helpId={helpId}
          value={value}
          invalidProps={invalidProps}
          onChange={onChange}
        />
      )}
      {error && (
        <p id={errorId} className="mt-2 text-sm font-bold text-[var(--error)]">
          {error}
        </p>
      )}
    </div>
  );
}

function YesNoField({
  field,
  helpId,
  selectedYesNo,
  invalidProps,
  onChange,
}: {
  field: FieldDefinition;
  helpId: string;
  selectedYesNo: string;
  invalidProps: Record<string, string | boolean | undefined>;
  onChange: (value: Answer) => void;
}) {
  return (
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
        <p id={helpId} className="mt-2 text-sm leading-5 text-[var(--muted)]">
          {field.helper}
        </p>
      )}
      <RadioGroup.Root
        value={selectedYesNo}
        onValueChange={(option) =>
          onChange(field.yesNoValues?.[option as "YES" | "NO"] ?? option)
        }
        className="mt-3 grid grid-cols-2 gap-3"
        {...invalidProps}
      >
        {["YES", "NO"].map((option) => (
          <label
            key={option}
            className={cn(
              "flex min-h-13 cursor-pointer items-center gap-3 rounded-2xl border bg-white px-4 font-bold transition hover:border-[var(--primary)]",
              selectedYesNo === option
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
  );
}

function StandardField({
  field,
  helpId,
  value,
  invalidProps,
  onChange,
}: {
  field: FieldDefinition;
  helpId: string;
  value?: Answer;
  invalidProps: Record<string, string | boolean | undefined>;
  onChange: (value: Answer) => void;
}) {
  return (
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
        <p id={helpId} className="mt-1.5 text-sm leading-5 text-[var(--muted)]">
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
