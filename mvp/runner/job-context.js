/**
 * Mutable per-run context for the DS-160 script.
 * Set via configureJobContext() before calling runDs160Job().
 */

import { resolve as pathResolve } from "node:path";

/** @typedef {import('../shared/types.ts').Ds160JobHooks} Ds160JobHooks */

/** @type {{
 *   workspaceRoot: string;
 *   hooks: Ds160JobHooks;
 *   locationCode: string;
 *   securityAnswer: string;
 *   resumeApplication: boolean;
 *   allowSubmit: boolean;
 *   lastPdfPath: string | null;
 *   lastConfirmation: object | null;
 *   lastApplicationId: string | null;
 * }} */
export const jobContext = {
  workspaceRoot: process.cwd(),
  hooks: {
    async onCaptchaNeeded() {
      throw new Error("onCaptchaNeeded hook not configured");
    },
    async onValidationError() {
      throw new Error("onValidationError hook not configured");
    },
  },
  locationCode: "HYD",
  securityAnswer: "TestAnswer",
  resumeApplication: false,
  allowSubmit: false,
  lastPdfPath: null,
  lastConfirmation: null,
  lastApplicationId: null,
};

/**
 * @param {Partial<typeof jobContext>} next
 */
export function configureJobContext(next) {
  Object.assign(jobContext, next);
}

/** Resolve a path inside the current job workspace. */
export function workspacePath(...parts) {
  return pathResolve(jobContext.workspaceRoot, ...parts);
}
