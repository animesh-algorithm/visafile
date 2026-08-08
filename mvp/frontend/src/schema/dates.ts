import type { ResolvedSchema } from "./types";
import { monthMode } from "./resolve";

const MONTH_CODES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

export function datePartsToInput(
  value: unknown,
  schema: ResolvedSchema,
): string {
  if (!value || typeof value !== "object") return "";
  const v = value as { day?: string; month?: string; year?: string };
  if (!v.day || !v.month || !v.year) return "";
  const mode = monthMode(schema);
  let monthNum: number;
  if (mode === "code") {
    monthNum = MONTH_CODES.indexOf(v.month as (typeof MONTH_CODES)[number]) + 1;
  } else {
    monthNum = Number(v.month);
  }
  if (!monthNum || monthNum < 1 || monthNum > 12) return "";
  const day = String(v.day).padStart(2, "0");
  const month = String(monthNum).padStart(2, "0");
  return `${v.year}-${month}-${day}`;
}

export function inputToDateParts(
  iso: string,
  schema: ResolvedSchema,
): { day: string; month: string; year: string } | null {
  if (!iso) return null;
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return null;
  const mode = monthMode(schema);
  const monthNum = Number(month);
  let monthOut: string;
  if (mode === "code") {
    monthOut = MONTH_CODES[monthNum - 1] ?? "JAN";
  } else if (mode === "pad") {
    monthOut = String(monthNum).padStart(2, "0");
  } else {
    monthOut = String(monthNum);
  }
  // DatePartsMonthNum uses DayNum (unpadded); others use DayPad
  const finalDay = mode === "num" ? String(Number(day)) : day.padStart(2, "0");

  return { day: finalDay, month: monthOut, year };
}
