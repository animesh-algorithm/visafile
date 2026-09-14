import type { Answer } from "@/lib/intake-definition";

export function hasValue(value: Answer | undefined) {
  return Array.isArray(value)
    ? value.length > 0
    : value !== undefined && value !== "";
}
