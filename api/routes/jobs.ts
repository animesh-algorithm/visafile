import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { validateApplication } from "../../shared/validate.js";
import { insertJob, getJob } from "../db/client.js";
import { enqueueJob } from "../../worker/queue.js";
import { getPdfStorage } from "../../shared/storage/index.js";
import type { Ds160Application } from "../../shared/schema/ds160-application.js";

export async function registerJobRoutes(app: FastifyInstance) {
  app.post("/jobs", async (request, reply) => {
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
      const job = await getJob(request.params.jobId);
      if (!job) {
        return reply.code(404).send({ error: "Job not found" });
      }
      return {
        jobId: job.id,
        status: job.status,
        pdfPath: job.pdf_path,
        error: job.error,
        payload: job.payload,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      };
    },
  );

  app.get<{ Params: { jobId: string } }>(
    "/jobs/:jobId/pdf",
    async (request, reply) => {
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
