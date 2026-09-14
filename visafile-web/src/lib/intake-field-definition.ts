export type Answer = string | boolean | string[];
export type Answers = Record<string, Answer>;

export interface Option {
  value: string;
  label: string;
}

export interface Condition {
  field: string;
  equals: Answer;
}

export interface FieldDefinition {
  id: string;
  label: string;
  kind:
    | "text"
    | "email"
    | "tel"
    | "date"
    | "select"
    | "yesno"
    | "textarea"
    | "checkbox"
    | "list";
  required?: boolean;
  helper?: string;
  placeholder?: string;
  options?: Option[];
  when?: Condition;
  width?: "half" | "full";
  sensitive?: boolean;
  redactOnReview?: boolean;
  yesNoValues?: { YES: boolean; NO: boolean };
}

export interface FieldGroup {
  title: string;
  description?: string;
  fields: FieldDefinition[];
}

export interface IntakeStage {
  id: string;
  shortTitle: string;
  title: string;
  description: string;
  time: string;
  groups: FieldGroup[];
}

export const yesNo = (
  id: string,
  label: string,
  extras: Partial<FieldDefinition> = {},
): FieldDefinition => ({
  id,
  label,
  kind: "yesno",
  required: true,
  width: "full",
  ...extras,
});

export const booleanYesNo = (
  id: string,
  label: string,
  yesNoValues: { YES: boolean; NO: boolean },
  extras: Partial<FieldDefinition> = {},
): FieldDefinition => yesNo(id, label, { yesNoValues, ...extras });

export const text = (
  id: string,
  label: string,
  extras: Partial<FieldDefinition> = {},
): FieldDefinition => ({ id, label, kind: "text", required: true, ...extras });

export const optionalText = (
  id: string,
  label: string,
  extras: Partial<FieldDefinition> = {},
): FieldDefinition => ({ id, label, kind: "text", ...extras });

export const date = (
  id: string,
  label: string,
  extras: Partial<FieldDefinition> = {},
): FieldDefinition => ({ id, label, kind: "date", required: true, ...extras });

export const select = (
  id: string,
  label: string,
  options: Option[],
  extras: Partial<FieldDefinition> = {},
): FieldDefinition => ({
  id,
  label,
  kind: "select",
  options,
  required: true,
  ...extras,
});

export const explainIfYes = (id: string, label: string): FieldDefinition[] => [
  yesNo(id, label, { sensitive: true }),
  {
    id: `${id}.explain`,
    label: "Please explain",
    kind: "textarea",
    required: true,
    width: "full",
    sensitive: true,
    when: { field: id, equals: "YES" },
    helper:
      "Include dates and relevant details. You can review this before anything moves forward.",
  },
];
