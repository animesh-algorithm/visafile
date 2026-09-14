import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import {
  publishClientAnswer,
  subscribeJobEvents,
} from "../shared/pubsub.js";
import type { JobWsMessage } from "../shared/types.js";
import { getJob } from "./db/client.js";

const EVENTS = [
  "events",
  "status",
  "captcha-needed",
  "correction-needed",
  "completed",
  "failed",
] as const;

export async function registerWebSocket(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, async (socket: WebSocket, request) => {
    const expectedToken = process.env.AUTOMATION_API_TOKEN?.trim();
    if (
      expectedToken &&
      request.headers.authorization !== `Bearer ${expectedToken}`
    ) {
      socket.send(JSON.stringify({ type: "failed", error: "Unauthorized" }));
      socket.close();
      return;
    }
    const url = new URL(request.url, "http://localhost");
    const jobId = url.searchParams.get("jobId");
    if (!jobId) {
      socket.send(JSON.stringify({ type: "failed", error: "Missing jobId" }));
      socket.close();
      return;
    }

    const job = await getJob(jobId);
    if (!job) {
      socket.send(JSON.stringify({ type: "failed", error: "Job not found" }));
      socket.close();
      return;
    }

    socket.send(
      JSON.stringify({
        type: "status",
        status: job.status,
      } satisfies JobWsMessage),
    );

    if (job.status === "completed" && job.pdf_path) {
      socket.send(
        JSON.stringify({
          type: "completed",
          pdfPath: job.pdf_path,
          downloadUrl: `/jobs/${jobId}/pdf`,
        } satisfies JobWsMessage),
      );
    }
    if (job.status === "failed" && job.error) {
      socket.send(
        JSON.stringify({
          type: "failed",
          error: job.error,
        } satisfies JobWsMessage),
      );
    }

    const unsubOrPromise = subscribeJobEvents(jobId, EVENTS, (payload) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(payload);
      }
    });
    const unsubscribe =
      typeof unsubOrPromise === "function"
        ? unsubOrPromise
        : await unsubOrPromise;

    socket.on("message", async (raw) => {
      let message: JobWsMessage;
      try {
        message = JSON.parse(String(raw)) as JobWsMessage;
      } catch {
        socket.send(
          JSON.stringify({ type: "failed", error: "Invalid JSON message" }),
        );
        return;
      }

      try {
        await publishClientAnswer(jobId, message);
      } catch (error) {
        socket.send(
          JSON.stringify({
            type: "failed",
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    });

    socket.on("close", () => {
      unsubscribe();
    });
  });
}
