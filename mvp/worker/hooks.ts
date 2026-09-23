import type {
  Ds160JobHooks,
  FieldCorrection,
  JobStatus,
  ValidationErrorItem,
} from "../shared/types.js";
import {
  publishJobMessage,
  publishStatus,
  waitForJobMessage,
} from "../shared/pubsub.js";
import { updateJobStatus } from "../api/db/client.js";
import { matchCeacError } from "../shared/ceac-field-map.js";

function enrichErrors(errors: ValidationErrorItem[]): ValidationErrorItem[] {
  return errors.map((e) => {
    const binding = matchCeacError(e.message);
    if (!binding) return e;
    return {
      ...e,
      field: e.field || binding.target,
      kind: e.kind || binding.kind,
      schemaPath: e.schemaPath || binding.schemaPath,
    };
  });
}

export function createJobHooks(jobId: string): Ds160JobHooks {
  return {
    async onStatus(status: JobStatus, detail?: string) {
      await updateJobStatus(
        jobId,
        status,
        status === "filling" || status === "submitting"
          ? { pending_interaction: null }
          : undefined,
      );
      await publishStatus(jobId, status, detail);
    },

    async onBrowserCheckNeeded(interaction) {
      await updateJobStatus(jobId, "awaiting_browser_check", {
        pending_interaction: {
          type: "browser_check",
          ...interaction,
        },
      });
      await publishStatus(
        jobId,
        "awaiting_browser_check",
        interaction.reason,
      );
    },

    async onCaptchaNeeded(imageBuffer: Buffer): Promise<string> {
      await updateJobStatus(jobId, "awaiting_captcha", {
        pending_interaction: {
          type: "captcha",
          imageBase64: imageBuffer.toString("base64"),
        },
      });
      await publishJobMessage(jobId, {
        type: "captcha-needed",
        imageBase64: imageBuffer.toString("base64"),
      });

      const reply = await waitForJobMessage(jobId, "captcha-answer");
      if (reply.type !== "captcha-answer" || !reply.answer?.trim()) {
        throw new Error("Invalid captcha-answer message");
      }
      await updateJobStatus(jobId, "filling", { pending_interaction: null });
      await publishStatus(jobId, "filling");
      return reply.answer.trim();
    },

    async onValidationError(
      errors: ValidationErrorItem[],
    ): Promise<FieldCorrection[]> {
      const enriched = enrichErrors(errors);
      await updateJobStatus(jobId, "awaiting_correction", {
        pending_interaction: { type: "correction", errors: enriched },
      });
      await publishJobMessage(jobId, {
        type: "correction-needed",
        errors: enriched,
      });

      const reply = await waitForJobMessage(jobId, "correction-answer");
      if (reply.type !== "correction-answer") {
        throw new Error("Invalid correction-answer message");
      }
      await updateJobStatus(jobId, "filling", { pending_interaction: null });
      await publishStatus(jobId, "filling");
      return reply.corrections ?? [];
    },
  };
}
