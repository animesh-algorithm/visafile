import { Redis } from "ioredis";
import { jobChannel, type JobStatus, type JobWsMessage } from "./types.js";

export function createRedis(url?: string): Redis {
  return new Redis(url ?? process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null,
  });
}

export async function publishJobMessage(
  redis: Redis,
  jobId: string,
  message: JobWsMessage,
): Promise<void> {
  await redis.publish(jobChannel(jobId, message.type), JSON.stringify(message));
  await redis.publish(jobChannel(jobId, "events"), JSON.stringify(message));
}

/**
 * Wait for a specific answer message on a Redis channel.
 */
export function waitForMessage<T = unknown>(
  redis: Redis,
  channel: string,
  timeoutMs = 10 * 60_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const subscriber = redis.duplicate();
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting on ${channel}`));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      subscriber.unsubscribe(channel).catch(() => undefined);
      subscriber.quit().catch(() => undefined);
    }

    subscriber.subscribe(channel, (err: Error | null | undefined) => {
      if (err) {
        cleanup();
        reject(err);
      }
    });

    subscriber.on("message", (ch: string, payload: string) => {
      if (ch !== channel) return;
      cleanup();
      try {
        resolve(JSON.parse(payload) as T);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function publishStatus(
  redis: Redis,
  jobId: string,
  status: JobStatus,
  detail?: string,
): Promise<void> {
  await publishJobMessage(redis, jobId, { type: "status", status, detail });
}
