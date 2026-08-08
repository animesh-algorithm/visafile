import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { createSampleApplication } from "../shared/sample-application.js";
import { materializeJobWorkspace } from "../shared/workspace.js";
import { validateApplication } from "../shared/validate.js";
import { configureJobContext } from "../runner/job-context.js";

const app = createSampleApplication();
const validation = validateApplication(app);
console.log("validation", validation);
if (!validation.ok) process.exit(1);

writeFileSync(
  new URL("../sample-application.json", import.meta.url),
  `${JSON.stringify(app, null, 2)}\n`,
);

const jobId = randomUUID();
const workspace = await materializeJobWorkspace(jobId, app);
configureJobContext({ workspaceRoot: workspace });
const { runDs160Job } = await import("../runner/ds160-script.js");
console.log("workspace", workspace);
console.log("runDs160Job", typeof runDs160Job);
console.log("smoke ok");
