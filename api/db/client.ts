import pg from "pg";
import type { Ds160Application } from "../../shared/schema/ds160-application.js";
import type { JobRecord, JobStatus } from "../../shared/types.js";
import { isLocalStack } from "../../shared/config.js";
import {
  sqliteGetJob,
  sqliteInsertJob,
  sqliteUpdateJobStatus,
} from "./sqlite.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ??
        "postgres://ds160:ds160@127.0.0.1:5432/ds160",
    });
  }
  return pool;
}

export async function insertJob(
  id: string,
  payload: Ds160Application,
): Promise<JobRecord> {
  if (isLocalStack()) {
    return sqliteInsertJob(id, payload);
  }
  const { rows } = await getPool().query<JobRecord>(
    `INSERT INTO jobs (id, status, payload)
     VALUES ($1, 'queued', $2::jsonb)
     RETURNING id, status, payload, pdf_path, error,
               created_at::text, updated_at::text`,
    [id, JSON.stringify(payload)],
  );
  return rows[0];
}

export async function getJob(id: string): Promise<JobRecord | null> {
  if (isLocalStack()) {
    return sqliteGetJob(id);
  }
  const { rows } = await getPool().query<JobRecord>(
    `SELECT id, status, payload, pdf_path, error,
            created_at::text, updated_at::text
     FROM jobs WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
  extra?: { pdf_path?: string | null; error?: string | null },
): Promise<JobRecord | null> {
  if (isLocalStack()) {
    return sqliteUpdateJobStatus(id, status, extra);
  }
  const { rows } = await getPool().query<JobRecord>(
    `UPDATE jobs
     SET status = $2,
         pdf_path = CASE WHEN $3::boolean THEN $4 ELSE pdf_path END,
         error = CASE WHEN $5::boolean THEN $6 ELSE error END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, status, payload, pdf_path, error,
               created_at::text, updated_at::text`,
    [
      id,
      status,
      extra !== undefined && "pdf_path" in extra,
      extra?.pdf_path ?? null,
      extra !== undefined && "error" in extra,
      extra?.error ?? null,
    ],
  );
  return rows[0] ?? null;
}
