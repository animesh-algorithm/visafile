import type { Ds160JobPayload } from "./queue.js";
import { processDs160Job } from "./process-job.js";

const pending: Ds160JobPayload[] = [];
let running = false;

async function drain(): Promise<void> {
  if (running) return;
  running = true;
  try {
    while (pending.length > 0) {
      const job = pending.shift()!;
      try {
        await processDs160Job(job);
      } catch {
        // processDs160Job already recorded failure
      }
    }
  } finally {
    running = false;
  }
}

export async function enqueueLocalJob(payload: Ds160JobPayload): Promise<void> {
  pending.push(payload);
  void drain();
}

export function startLocalWorker(): void {
  console.log("[worker] local in-process queue ready (no Redis)");
}
