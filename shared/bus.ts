import { EventEmitter } from "node:events";
import type { JobWsMessage } from "./types.js";

/**
 * In-process pub/sub used when LOCAL_STACK=true (API embeds the worker).
 */
class LocalBus {
  private readonly ee = new EventEmitter();

  constructor() {
    this.ee.setMaxListeners(100);
  }

  publish(channel: string, payload: string): void {
    this.ee.emit(channel, payload);
    // Fan-out pattern matching Redis events channel usage
    if (!channel.endsWith(":events")) {
      const parts = channel.split(":");
      if (parts.length >= 3) {
        const eventsChannel = `${parts[0]}:${parts[1]}:events`;
        this.ee.emit(eventsChannel, payload);
      }
    }
  }

  subscribe(
    channel: string,
    handler: (payload: string) => void,
  ): () => void {
    this.ee.on(channel, handler);
    return () => this.ee.off(channel, handler);
  }

  waitFor(
    channel: string,
    timeoutMs = 10 * 60_000,
  ): Promise<JobWsMessage> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timed out waiting on ${channel}`));
      }, timeoutMs);

      const handler = (payload: string) => {
        cleanup();
        try {
          resolve(JSON.parse(payload) as JobWsMessage);
        } catch (error) {
          reject(error);
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        this.ee.off(channel, handler);
      };

      this.ee.on(channel, handler);
    });
  }
}

export const localBus = new LocalBus();
