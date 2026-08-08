import type { Ds160JobHooks } from "../shared/types.js";

export const jobContext: {
  workspaceRoot: string;
  hooks: Ds160JobHooks;
  locationCode: string;
  securityAnswer: string;
  resumeApplication: boolean;
  allowSubmit: boolean;
  lastPdfPath: string | null;
  lastConfirmation: Record<string, unknown> | null;
  lastApplicationId: string | null;
};

export function configureJobContext(
  next: Partial<typeof jobContext>,
): void;

export function workspacePath(...parts: string[]): string;
