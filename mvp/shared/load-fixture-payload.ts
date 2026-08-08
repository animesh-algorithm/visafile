import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  DS160_SECTION_FIXTURES,
  type Ds160Application,
} from "./schema/ds160-application.js";
import { MVP_ROOT } from "./workspace.js";

/** Repo root (parent of mvp/) — where original fixtures live. */
const REPO_ROOT = resolve(MVP_ROOT, "..");

/**
 * Build a Ds160Application from the existing root fixtures/ (read-only).
 * Useful for local demos without retyping the full form.
 */
export async function loadFixturePayload(): Promise<Ds160Application> {
  const sections: Record<string, unknown> = {};
  for (const [key, relativePath] of Object.entries(DS160_SECTION_FIXTURES)) {
    const path = resolve(REPO_ROOT, relativePath);
    sections[key] = JSON.parse(await readFile(path, "utf8"));
  }

  return {
    meta: {
      locationCode: process.env.DS160_LOCATION ?? "HYD",
      securityAnswer:
        process.env.DS160_SECURITY_ANSWER?.trim() || "TestAnswer",
      applicationId: process.env.DS160_APPLICATION_ID?.trim() || undefined,
      allowSubmit:
        process.env.DS160_ALLOW_SUBMIT === "true" ||
        process.env.DS160_ALLOW_SUBMIT === "1",
    },
    ...sections,
  } as Ds160Application;
}
