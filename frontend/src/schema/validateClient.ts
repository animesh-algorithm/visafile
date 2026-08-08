import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import type { ErrorObject } from "ajv";
import { applicationSchema } from "./resolve";

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateFn = ajv.compile(applicationSchema);

export interface ClientValidationResult {
  ok: boolean;
  errors: string[];
  byPath: Record<string, string>;
}

export function validateApplicationClient(
  data: unknown,
): ClientValidationResult {
  const ok = Boolean(validateFn(data));
  if (ok) return { ok: true, errors: [], byPath: {} };

  const byPath: Record<string, string> = {};
  const errors = ((validateFn.errors as ErrorObject[] | null) ?? []).map(
    (e) => {
      const path = e.instancePath || "/";
      const msg = `${path} ${e.message ?? "invalid"}`;
      // instancePath like /personalInformation1/surname
      const key = path.replace(/^\//, "").replace(/\//g, ".");
      if (key && !byPath[key]) byPath[key] = e.message ?? "invalid";
      return msg;
    },
  );
  return { ok: false, errors, byPath };
}

export function validateSectionClient(
  sectionKey: string,
  sectionData: unknown,
  fullApp: Record<string, unknown>,
): ClientValidationResult {
  return validateApplicationClient({ ...fullApp, [sectionKey]: sectionData });
}
