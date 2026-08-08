import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  Ds160JobHooks,
  FieldCorrection,
  JobStatus,
  ValidationErrorItem,
} from "../shared/types.js";

function createRl() {
  return readline.createInterface({ input, output });
}

/**
 * Terminal-based hooks for isolated runner testing (spec step 2).
 */
export function createTerminalHooks(options?: {
  captchaImagePath?: string;
}): Ds160JobHooks {
  const captchaImagePath =
    options?.captchaImagePath ?? resolve("data/captcha-prompt.png");

  return {
    async onStatus(status: JobStatus, detail?: string) {
      console.log(`[status] ${status}${detail ? ` — ${detail}` : ""}`);
    },

    async onCaptchaNeeded(imageBuffer: Buffer): Promise<string> {
      await writeFile(captchaImagePath, imageBuffer);
      console.log(`\nCAPTCHA image written to ${captchaImagePath}`);
      const rl = createRl();
      try {
        const answer = await rl.question("Enter CAPTCHA code: ");
        return answer.trim();
      } finally {
        rl.close();
      }
    },

    async onValidationError(
      errors: ValidationErrorItem[],
    ): Promise<FieldCorrection[]> {
      console.error("\nCEAC validation errors:");
      for (const err of errors) {
        console.error(`  - ${err.message}`);
      }
      console.log(
        '\nEnter corrections as JSON array, e.g. [{"target":"tbxAPP_SURNAME","value":"SMITH","kind":"text"}]',
      );
      console.log("Or press Enter to abort.");
      const rl = createRl();
      try {
        const line = await rl.question("corrections> ");
        if (!line.trim()) return [];
        const parsed = JSON.parse(line) as FieldCorrection[];
        if (!Array.isArray(parsed)) {
          throw new Error("Expected a JSON array of corrections");
        }
        return parsed;
      } finally {
        rl.close();
      }
    },
  };
}
