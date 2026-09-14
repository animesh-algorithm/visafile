import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { validateApplication } from "../../shared/validate.js";
import { insertJob, getJob } from "../db/client.js";
import { enqueueJob } from "../../worker/queue.js";
import { getPdfStorage } from "../../shared/storage/index.js";
import type { Ds160Application } from "../../shared/schema/ds160-application.js";
import { publishClientAnswer } from "../../shared/pubsub.js";
import type { FieldCorrection } from "../../shared/types.js";

function isAuthorized(request: { headers: Record<string, unknown> }) {
  const expectedToken = process.env.AUTOMATION_API_TOKEN?.trim();
  return (
    !expectedToken ||
    request.headers.authorization === `Bearer ${expectedToken}`
  );
}

function requireAuthorization(
  request: { headers: Record<string, unknown> },
  reply: { code: (statusCode: number) => { send: (body: unknown) => unknown } },
) {
  if (isAuthorized(request)) return null;
  return reply.code(401).send({ error: "Unauthorized" });
}

export async function registerJobRoutes(app: FastifyInstance) {
  app.post("/jobs", async (request, reply) => {
    const unauthorized = requireAuthorization(request, reply);
    if (unauthorized) return unauthorized;
    const body = request.body;
    const validation = validateApplication(body);
    if (!validation.ok) {
      return reply.code(400).send({
        error: "Invalid payload",
        details: validation.errors,
      });
    }

    const application = body as Ds160Application;
    const jobId = randomUUID();
    await insertJob(jobId, application);
    await enqueueJob({ jobId, application });

    return reply.code(201).send({ jobId });
  });

  app.get<{ Params: { jobId: string } }>(
    "/jobs/:jobId",
    async (request, reply) => {
      const unauthorized = requireAuthorization(request, reply);
      if (unauthorized) return unauthorized;
      const job = await getJob(request.params.jobId);
      if (!job) {
        return reply.code(404).send({ error: "Job not found" });
      }
      return {
        jobId: job.id,
        status: job.status,
        pdfPath: job.pdf_path,
        error: job.error,
        pendingInteraction: job.pending_interaction,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      };
    },
  );

  app.post<{
    Params: { jobId: string };
    Body: { answer?: string };
  }>("/jobs/:jobId/captcha", async (request, reply) => {
    const unauthorized = requireAuthorization(request, reply);
    if (unauthorized) return unauthorized;

    const job = await getJob(request.params.jobId);
    if (!job) return reply.code(404).send({ error: "Job not found" });
    if (job.status !== "awaiting_captcha") {
      return reply.code(409).send({
        error: "Job is not waiting for CAPTCHA",
      });
    }

    const answer = request.body?.answer?.trim();
    if (!answer || answer.length > 32) {
      return reply.code(400).send({ error: "Invalid CAPTCHA answer" });
    }
    await publishClientAnswer(job.id, { type: "captcha-answer", answer });
    return reply.code(202).send({ accepted: true });
  });

  app.post<{
    Params: { jobId: string };
    Body: { corrections?: FieldCorrection[] };
  }>("/jobs/:jobId/corrections", async (request, reply) => {
    const unauthorized = requireAuthorization(request, reply);
    if (unauthorized) return unauthorized;

    const job = await getJob(request.params.jobId);
    if (!job) return reply.code(404).send({ error: "Job not found" });
    if (job.status !== "awaiting_correction") {
      return reply.code(409).send({
        error: "Job is not waiting for corrections",
      });
    }

    const corrections = request.body?.corrections;
    if (
      !Array.isArray(corrections) ||
      corrections.length === 0 ||
      corrections.length > 25 ||
      corrections.some(
        (item) => !item?.target?.trim() || typeof item.value !== "string",
      )
    ) {
      return reply.code(400).send({ error: "Invalid corrections" });
    }
    await publishClientAnswer(job.id, {
      type: "correction-answer",
      corrections,
    });
    return reply.code(202).send({ accepted: true });
  });

  app.get<{ Params: { jobId: string } }>(
    "/jobs/:jobId/pdf",
    async (request, reply) => {
      const unauthorized = requireAuthorization(request, reply);
      if (unauthorized) return unauthorized;
      const job = await getJob(request.params.jobId);
      if (!job) {
        return reply.code(404).send({ error: "Job not found" });
      }
      if (job.status !== "completed" || !job.pdf_path) {
        return reply.code(409).send({
          error: "PDF not available",
          status: job.status,
        });
      }

      const storage = getPdfStorage();
      const exists = await storage.exists(job.pdf_path);
      if (!exists) {
        return reply.code(404).send({ error: "PDF file missing in storage" });
      }

      reply.header("content-type", "application/pdf");
      reply.header(
        "content-disposition",
        `attachment; filename="ds160-${job.id}.pdf"`,
      );
      return reply.send(await storage.openReadStream(job.pdf_path));
    },
  );
}
