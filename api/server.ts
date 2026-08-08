import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isLocalStack } from "../shared/config.js";
import { migrateSqlite } from "./db/sqlite.js";
import { registerJobRoutes } from "./routes/jobs.js";
import { registerWebSocket } from "./ws.js";
import { startLocalWorker } from "../worker/local-queue.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  if (isLocalStack()) {
    migrateSqlite();
    startLocalWorker();
    console.log("[api] LOCAL_STACK=true (SQLite + in-process worker/bus)");
  }

  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") ?? true,
  });
  await app.register(websocket);

  await app.register(fastifyStatic, {
    root: resolve(__dirname, "../public"),
    prefix: "/",
    decorateReply: false,
  });

  app.get("/health", async () => ({
    ok: true,
    localStack: isLocalStack(),
  }));

  await registerJobRoutes(app);
  await registerWebSocket(app);

  const port = Number(process.env.API_PORT ?? 3001);
  const host = process.env.API_HOST ?? "0.0.0.0";
  await app.listen({ port, host });
  console.log(`API listening on http://${host}:${port}`);
  console.log(`WebSocket: ws://${host}:${port}/ws?jobId=...`);
  console.log(`Test page: http://localhost:${port}/test-ws.html`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
