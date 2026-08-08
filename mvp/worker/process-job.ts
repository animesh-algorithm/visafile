import { configureJobContext } from "../runner/job-context.js";
import { runDs160Job } from "../runner/ds160-script.js";
import { materializeJobWorkspace } from "../shared/workspace.js";
import { publishJobMessage } from "../shared/pubsub.js";
import { updateJobStatus } from "../api/db/client.js";
import { getPdfStorage } from "../shared/storage/index.js";
import { createJobHooks } from "./hooks.js";
import { setActiveJobId } from "./active-job.js";
import type { Ds160JobPayload } from "./queue.js";

export async function processDs160Job(data: Ds160JobPayload) {
  const { jobId, application } = data;
  console.log(`[worker] starting job ${jobId}`);
  setActiveJobId(jobId);

  const workspace = await materializeJobWorkspace(jobId, application);
  configureJobContext({
    workspaceRoot: workspace,
    locationCode: application.meta.locationCode,
    securityAnswer: application.meta.securityAnswer,
    resumeApplication: Boolean(application.meta.applicationId),
    allowSubmit: Boolean(application.meta.allowSubmit),
  });

  const hooks = createJobHooks(jobId);

  try {
    await updateJobStatus(jobId, "filling");
    await publishJobMessage(jobId, { type: "status", status: "filling" });

    const result = await runDs160Job(application, hooks);

    let pdfUri = result.pdfPath;
    if (result.pdfPath) {
      try {
        pdfUri = await getPdfStorage().put(jobId, result.pdfPath);
        console.log(`[worker] PDF stored at ${pdfUri}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[worker] PDF storage upload failed: ${message}`);
        throw new Error(`PDF storage upload failed: ${message}`);
      }
    }

    await updateJobStatus(jobId, "completed", {
      pdf_path: pdfUri,
      error: null,
    });

    const downloadUrl = `/jobs/${jobId}/pdf`;
    await publishJobMessage(jobId, {
      type: "completed",
      pdfPath: pdfUri ?? "",
      downloadUrl,
    });

    console.log(`[worker] job ${jobId} completed pdf=${pdfUri}`);
    return { ...result, pdfPath: pdfUri };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[worker] job ${jobId} failed:`, message);
    await updateJobStatus(jobId, "failed", { error: message });
    await publishJobMessage(jobId, { type: "failed", error: message });
    throw error;
  } finally {
    setActiveJobId(null);
  }
}
