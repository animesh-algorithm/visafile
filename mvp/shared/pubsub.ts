import type { Redis } from "ioredis";
import { isLocalStack } from "./config.js";
import { localBus } from "./bus.js";
import {
  createRedis,
  publishJobMessage as redisPublish,
  waitForMessage as redisWait,
} from "./redis.js";
import { jobChannel, type JobStatus, type JobWsMessage } from "./types.js";

let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) redisClient = createRedis();
  return redisClient;
}

export async function publishJobMessage(
  jobId: string,
  message: JobWsMessage,
): Promise<void> {
  if (isLocalStack()) {
    const payload = JSON.stringify(message);
    localBus.publish(jobChannel(jobId, message.type), payload);
    return;
  }
  await redisPublish(getRedis(), jobId, message);
}

export async function publishStatus(
  jobId: string,
  status: JobStatus,
  detail?: string,
): Promise<void> {
  await publishJobMessage(jobId, { type: "status", status, detail });
}

export async function waitForJobMessage(
  jobId: string,
  event: "captcha-answer" | "correction-answer",
  timeoutMs = 10 * 60_000,
): Promise<JobWsMessage> {
  const channel = jobChannel(jobId, event);
  if (isLocalStack()) {
    return localBus.waitFor(channel, timeoutMs);
  }
  return redisWait<JobWsMessage>(getRedis(), channel, timeoutMs);
}

export type Unsubscribe = () => void;

export function subscribeJobEvents(
  jobId: string,
  events: readonly string[],
  onMessage: (payload: string) => void,
): Unsubscribe | Promise<Unsubscribe> {
  if (isLocalStack()) {
    const unsubs = events.map((event) =>
      localBus.subscribe(jobChannel(jobId, event), onMessage),
    );
    return () => {
      for (const unsub of unsubs) unsub();
    };
  }

  return (async () => {
    const subscriber = createRedis();
    const channels = events.map((e) => jobChannel(jobId, e));
    await subscriber.subscribe(...channels);
    subscriber.on("message", (_ch: string, payload: string) => {
      onMessage(payload);
    });
    return () => {
      subscriber.unsubscribe(...channels).catch(() => undefined);
      subscriber.quit().catch(() => undefined);
    };
  })();
}

export async function publishClientAnswer(
  jobId: string,
  message: JobWsMessage,
): Promise<void> {
  if (message.type !== "captcha-answer" && message.type !== "correction-answer") {
    throw new Error(`Unsupported client message type: ${message.type}`);
  }
  const channel = jobChannel(jobId, message.type);
  const payload = JSON.stringify(message);
  if (isLocalStack()) {
    localBus.publish(channel, payload);
    return;
  }
  const publisher = createRedis();
  try {
    await publisher.publish(channel, payload);
  } finally {
    await publisher.quit();
  }
}
