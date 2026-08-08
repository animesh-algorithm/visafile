import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ErrorObject, ValidateFunction } from "ajv";
import type { Ds160Application } from "./schema/ds160-application.js";

const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020.js");
const addFormats = require("ajv-formats");

const schemaPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "schema/ds160-application.schema.json",
);

const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateFn = ajv.compile(schema) as ValidateFunction;

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateApplication(data: unknown): ValidationResult {
  const ok = Boolean(validateFn(data));
  if (ok) {
    return { ok: true, errors: [] };
  }
  const errors = ((validateFn.errors as ErrorObject[] | null) ?? []).map(
    (e: ErrorObject) => `${e.instancePath || "/"} ${e.message ?? "invalid"}`,
  );
  return { ok: false, errors };
}

export function assertApplication(data: unknown): Ds160Application {
  const result = validateApplication(data);
  if (!result.ok) {
    throw new Error(`Invalid DS-160 payload:\n${result.errors.join("\n")}`);
  }
  return data as Ds160Application;
}
