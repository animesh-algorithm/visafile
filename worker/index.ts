import "dotenv/config";
import { Worker } from "bullmq";
import { isLocalStack } from "../shared/config.js";
import { QUEUE_NAME } from "../shared/types.js";
import { publishJobMessage } from "../shared/pubsub.js";
import { updateJobStatus } from "../api/db/client.js";
import { listStuckJobIds } from "../api/db/orphans.js";
import { processDs160Job } from "./process-job.js";
import { redisConnection, type Ds160JobPayload } from "./queue.js";
import { startLocalWorker } from "./local-queue.js";
import { getActiveJobId } from "./active-job.js";

async function markFailed(jobId: string, error: string) {
  await updateJobStatus(jobId, "failed", { error });
  await publishJobMessage(jobId, { type: "failed", error });
}

/**
 * When a worker process dies mid-job, Postgres can be left at
 * awaiting_captcha/filling. On next start, fail those orphans so the UI
 * doesn't hang forever.
 */
async function failOrphanedJobs() {
  const ids = await listStuckJobIds();
  for (const id of ids) {
    const msg =
      "Worker restarted while this job was in progress (orphaned). Re-submit the job.";
    console.log(`[worker] failing orphaned job ${id}`);
    await markFailed(id, msg);
  }
}

async function main() {
  if (isLocalStack()) {
    console.log(
      "[worker] LOCAL_STACK=true — worker is embedded in the API process.",
    );
    console.log("[worker] You can stop this process; use: npm run dev:api");
    startLocalWorker();
    await new Promise(() => undefined);
    return;
  }

  await failOrphanedJobs();

  // Short lock: while alive BullMQ renews it. Hard-kill → stall within ~1–2 min.
  const worker = new Worker<Ds160JobPayload>(
    QUEUE_NAME,
    async (job) => processDs160Job(job.data),
    {
      connection: redisConnection(),
      concurrency: 1,
      lockDuration: 60_000,
      stalledInterval: 30_000,
      maxStalledCount: 1,
    },
  );

  worker.on("ready", () => console.log("[worker] ready (Redis/BullMQ)"));

  worker.on("failed", async (job, err) => {
    const jobId = job?.data?.jobId;
    const message =
      err?.message ||
      "Worker failed (process may have restarted while job was in progress)";
    console.error(`[worker] failed ${job?.id} jobId=${jobId}:`, message);
    if (jobId) {
      try {
        await markFailed(
          jobId,
          `Worker failed before completion: ${message}. If this happened during awaiting_captcha/correction, re-submit the job.`,
        );
      } catch (e) {
        console.error("[worker] could not persist failure status", e);
      }
    }
  });

  worker.on("stalled", (jobId) => {
    console.error(`[worker] stalled bull job ${jobId}`);
  });

  let shuttingDown = false;
  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[worker] shutting down (${signal})…`);

    const active = getActiveJobId();
    if (active) {
      const msg = `Worker process stopped (${signal}) while job was in progress (often during awaiting_captcha/correction). Re-submit the job.`;
      try {
        await markFailed(active, msg);
        console.log(`[worker] marked active job ${active} as failed`);
      } catch (e) {
        console.error("[worker] failed to mark active job", e);
      }
    }

    try {
      await worker.close(true);
    } catch (e) {
      console.error("[worker] close error", e);
    }
    process.exit(0);
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
