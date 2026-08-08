import { Queue } from "bullmq";
import { QUEUE_NAME } from "../shared/types.js";
import type { Ds160Application } from "../shared/schema/ds160-application.js";
import { isLocalStack } from "../shared/config.js";
import { enqueueLocalJob } from "./local-queue.js";

export interface Ds160JobPayload {
  jobId: string;
  application: Ds160Application;
}

function redisConnection() {
  const url = new URL(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined,
    maxRetriesPerRequest: null as null,
  };
}

let queue: Queue<Ds160JobPayload> | null = null;

function getBullQueue(): Queue<Ds160JobPayload> {
  if (!queue) {
    queue = new Queue<Ds160JobPayload>(QUEUE_NAME, {
      connection: redisConnection(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 1,
      },
    });
  }
  return queue;
}

export async function enqueueJob(payload: Ds160JobPayload): Promise<void> {
  if (isLocalStack()) {
    await enqueueLocalJob(payload);
    return;
  }
  await getBullQueue().add("ds160-submission", payload, {
    jobId: payload.jobId,
  });
}

/** @deprecated use enqueueJob — kept for any leftover imports */
export function getQueue() {
  return {
    add: async (
      _name: string,
      data: Ds160JobPayload,
      _opts?: { jobId?: string },
    ) => {
      await enqueueJob(data);
    },
  };
}

export { redisConnection };
