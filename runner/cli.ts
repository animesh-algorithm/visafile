/**
 * Isolated terminal-hook runner (spec §4 step 2).
 *
 * Usage:
 *   npm run runner:terminal -- [--payload path/to/application.json]
 *
 * Defaults to building a payload from ../../fixtures/*.test.json + env meta.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { configureJobContext } from "./job-context.js";
import { runDs160Job } from "./ds160-script.js";
import { createTerminalHooks } from "./terminal-hooks.js";
import { materializeJobWorkspace, MVP_ROOT } from "../shared/workspace.js";
import type { Ds160Application } from "../shared/schema/ds160-application.js";
import { loadFixturePayload } from "../shared/load-fixture-payload.js";

async function main() {
  const args = process.argv.slice(2);
  const payloadIdx = args.indexOf("--payload");
  let application: Ds160Application;

  if (payloadIdx >= 0 && args[payloadIdx + 1]) {
    const raw = await readFile(resolve(args[payloadIdx + 1]), "utf8");
    application = JSON.parse(raw) as Ds160Application;
  } else {
    application = await loadFixturePayload();
  }

  const jobId = randomUUID();
  const workspace = await materializeJobWorkspace(jobId, application);
  configureJobContext({ workspaceRoot: workspace });

  console.log(`Job ${jobId}`);
  console.log(`Workspace: ${workspace}`);
  console.log(`MVP root: ${MVP_ROOT}`);

  const hooks = createTerminalHooks({
    captchaImagePath: resolve(workspace, "data/captcha.png"),
  });

  const result = await runDs160Job(application, hooks);
  console.log("\nResult:", JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
