import type { Ds160Application } from "./schema/ds160-application.js";

export type JobStatus =
  | "queued"
  | "filling"
  | "awaiting_browser_check"
  | "awaiting_captcha"
  | "awaiting_correction"
  | "submitting"
  | "completed"
  | "failed";

export interface JobRecord {
  id: string;
  status: JobStatus;
  payload: Ds160Application;
  pdf_path: string | null;
  error: string | null;
  pending_interaction: PendingInteraction | null;
  created_at: string;
  updated_at: string;
}

export type PendingInteraction =
  | {
      type: "browser_check";
      browserUrl: string;
      expiresAt: string;
      reason: string;
    }
  | { type: "captcha"; imageBase64: string }
  | { type: "correction"; errors: ValidationErrorItem[] };

export interface ValidationErrorItem {
  message: string;
  /** CEAC control id/name when known */
  field?: string;
  kind?: "text" | "select" | "radio" | "checkbox";
  /** Dot path into Ds160Application when mapped */
  schemaPath?: string;
}

export interface FieldCorrection {
  /** Full control id, name, or partial id for selectByPartialId */
  target: string;
  value: string;
  kind?: "text" | "select" | "radio" | "checkbox";
  /** When true, use selectByPartialId instead of fillControlByIdOrName */
  partialId?: boolean;
}

export interface Ds160JobHooks {
  onCaptchaNeeded: (imageBuffer: Buffer) => Promise<string>;
  onValidationError: (
    errors: ValidationErrorItem[],
  ) => Promise<FieldCorrection[]>;
  onBrowserCheckNeeded?: (interaction: {
    browserUrl: string;
    expiresAt: string;
    reason: string;
  }) => void | Promise<void>;
  onStatus?: (status: JobStatus, detail?: string) => void | Promise<void>;
}

export interface RunDs160JobResult {
  pdfPath: string | null;
  confirmation: Record<string, unknown> | null;
  applicationId: string | null;
}

/** Redis / WebSocket message envelopes */
export type JobWsMessage =
  | { type: "status"; status: JobStatus; detail?: string }
  | { type: "captcha-needed"; imageBase64: string }
  | { type: "captcha-answer"; answer: string }
  | { type: "correction-needed"; errors: ValidationErrorItem[] }
  | { type: "correction-answer"; corrections: FieldCorrection[] }
  | { type: "completed"; pdfPath: string; downloadUrl: string }
  | { type: "failed"; error: string };

export const QUEUE_NAME = "ds160-submission";

export function jobChannel(jobId: string, event: string): string {
  return `job:${jobId}:${event}`;
}
