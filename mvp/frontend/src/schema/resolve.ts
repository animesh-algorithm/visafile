import rootSchema from "./ds160-application.schema.json";
import type { JsonSchema, ResolvedSchema } from "./types";

export const applicationSchema = rootSchema as JsonSchema;

export function resolveRef(
  schema: JsonSchema,
  root: JsonSchema = applicationSchema,
): ResolvedSchema {
  if (!schema?.$ref) return schema;

  const ref = schema.$ref;
  if (!ref.startsWith("#/")) {
    throw new Error(`Unsupported $ref: ${ref}`);
  }
  const path = ref.slice(2).split("/");
  let cur: unknown = root;
  for (const part of path) {
    cur = (cur as Record<string, unknown>)?.[part];
    if (cur === undefined) {
      throw new Error(`Unresolved $ref: ${ref}`);
    }
  }
  const resolved = resolveRef(cur as JsonSchema, root);
  return {
    ...resolved,
    description: schema.description ?? resolved.description,
    title: schema.title ?? resolved.title,
    __name: path[path.length - 1],
  };
}

export function getSectionSchema(sectionKey: string): ResolvedSchema {
  const prop = applicationSchema.properties?.[sectionKey];
  if (!prop) throw new Error(`Unknown section: ${sectionKey}`);
  return resolveRef(prop);
}

export function isDatePartsSchema(schema: ResolvedSchema): boolean {
  const name = schema.__name ?? "";
  return (
    name.startsWith("DateParts") ||
    (schema.properties?.day != null &&
      schema.properties?.month != null &&
      schema.properties?.year != null &&
      Object.keys(schema.properties).length <= 3)
  );
}

export function monthMode(
  schema: ResolvedSchema,
): "code" | "num" | "pad" {
  const name = schema.__name ?? "";
  if (name.includes("MonthNum") || name === "DatePartsMonthNum") return "num";
  if (name.includes("MonthPad") || name === "DatePartsMonthPad") return "pad";
  // Inspect month ref
  const month = schema.properties?.month
    ? resolveRef(schema.properties.month)
    : null;
  if (month?.__name === "MonthNum" || month?.enum?.[0] === "1") return "num";
  if (month?.__name === "MonthPad" || month?.enum?.[0] === "01") return "pad";
  return "code";
}
