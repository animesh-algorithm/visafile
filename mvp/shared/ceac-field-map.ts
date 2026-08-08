/**
 * Maps CEAC validation messages / labels → schema path + wire control + input kind.
 * Used by the correction UI and to enrich worker validation errors.
 */
export interface CeacFieldBinding {
  /** Dot path into Ds160Application, e.g. personalInformation2.nationalIdentificationNumberDoesNotApply */
  schemaPath: string;
  /** CEAC partial control id for the worker */
  target: string;
  kind: "text" | "select" | "radio" | "checkbox";
  partialId?: boolean;
  label: string;
}

export const CEAC_FIELD_BINDINGS: CeacFieldBinding[] = [
  {
    label: "Surname",
    schemaPath: "personalInformation1.surname",
    target: "tbxAPP_SURNAME",
    kind: "text",
  },
  {
    label: "Given Name",
    schemaPath: "personalInformation1.givenNames",
    target: "tbxAPP_GIVEN_NAME",
    kind: "text",
  },
  {
    label: "Sex",
    schemaPath: "personalInformation1.sex",
    target: "ddlAPP_GENDER",
    kind: "select",
    partialId: true,
  },
  {
    label: "Marital Status",
    schemaPath: "personalInformation1.maritalStatus",
    target: "ddlAPP_MARITAL_STATUS",
    kind: "select",
    partialId: true,
  },
  {
    label: "City of Birth",
    schemaPath: "personalInformation1.cityOfBirth",
    target: "tbxAPP_POB_CITY",
    kind: "text",
  },
  {
    label: "Nationality",
    schemaPath: "personalInformation2.nationality",
    target: "ddlAPP_NATL",
    kind: "select",
    partialId: true,
  },
  {
    label: "National Identification Number",
    schemaPath: "personalInformation2.nationalIdentificationNumber",
    target: "tbxAPP_NATIONAL_ID",
    kind: "text",
  },
  {
    label: "National Identification Number Does Not Apply",
    schemaPath: "personalInformation2.nationalIdentificationNumberDoesNotApply",
    target: "cbexAPP_NATIONAL_ID_NA",
    kind: "checkbox",
    partialId: true,
  },
  {
    label: "Passport Number",
    schemaPath: "passport.passportNumber",
    target: "tbxPPT_NUM",
    kind: "text",
  },
  {
    label: "Email",
    schemaPath: "addressPhone.email",
    target: "tbxAPP_EMAIL_ADDR",
    kind: "text",
  },
  {
    label: "Primary Phone",
    schemaPath: "addressPhone.primaryPhone",
    target: "tbxAPP_HOME_TEL",
    kind: "text",
  },
  {
    label: "Street Address",
    schemaPath: "addressPhone.street",
    target: "tbxAPP_ADDR_LN1",
    kind: "text",
  },
];

/** Match a CEAC validation message to the best binding. */
export function matchCeacError(message: string): CeacFieldBinding | null {
  const lower = message.toLowerCase();

  // Prefer DNA checkbox when CEAC says National ID not completed
  if (/national identification number/i.test(message)) {
    if (/does not apply|not been completed|must be completed/i.test(message)) {
      return (
        CEAC_FIELD_BINDINGS.find(
          (b) =>
            b.schemaPath ===
            "personalInformation2.nationalIdentificationNumberDoesNotApply",
        ) ?? null
      );
    }
  }

  let best: CeacFieldBinding | null = null;
  let bestScore = 0;
  for (const binding of CEAC_FIELD_BINDINGS) {
    const label = binding.label.toLowerCase();
    if (lower.includes(label)) {
      const score = label.length;
      if (score > bestScore) {
        best = binding;
        bestScore = score;
      }
    }
  }
  return best;
}

export function getBySchemaPath(path: string): unknown {
  return CEAC_FIELD_BINDINGS.find((b) => b.schemaPath === path) ?? null;
}

export function readPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function writePath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const parts = path.split(".");
  const clone = structuredClone(obj);
  let cursor: Record<string, unknown> = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = cursor[key];
    cursor[key] =
      next && typeof next === "object" ? { ...(next as object) } : {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
  return clone;
}
