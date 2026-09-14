import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Ds160Application } from "../../shared/schema/ds160-application.js";
import type {
  JobRecord,
  JobStatus,
  PendingInteraction,
} from "../../shared/types.js";

const MVP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

let db: DatabaseSync | null = null;

function dbPath(): string {
  const fromEnv = process.env.SQLITE_PATH?.trim();
  if (fromEnv) return resolve(MVP_ROOT, fromEnv);
  return resolve(MVP_ROOT, "data/jobs.sqlite");
}

export function getSqlite(): DatabaseSync {
  if (!db) {
    const path = dbPath();
    mkdirSync(dirname(path), { recursive: true });
    db = new DatabaseSync(path);
    db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        payload TEXT NOT NULL,
        pdf_path TEXT,
        error TEXT,
        pending_interaction TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status);
    `);
    const columns = db.prepare("PRAGMA table_info(jobs)").all() as Array<{
      name: string;
    }>;
    if (!columns.some((column) => column.name === "pending_interaction")) {
      db.exec("ALTER TABLE jobs ADD COLUMN pending_interaction TEXT");
    }
  }
  return db;
}

function rowToJob(row: Record<string, unknown>): JobRecord {
  return {
    id: String(row.id),
    status: row.status as JobStatus,
    payload: JSON.parse(String(row.payload)) as Ds160Application,
    pdf_path: (row.pdf_path as string | null) ?? null,
    error: (row.error as string | null) ?? null,
    pending_interaction: row.pending_interaction
      ? (JSON.parse(String(row.pending_interaction)) as PendingInteraction)
      : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function sqliteInsertJob(
  id: string,
  payload: Ds160Application,
): JobRecord {
  getSqlite()
    .prepare(`INSERT INTO jobs (id, status, payload) VALUES (?, 'queued', ?)`)
    .run(id, JSON.stringify(payload));
  return sqliteGetJob(id)!;
}

export function sqliteGetJob(id: string): JobRecord | null {
  const row = getSqlite()
    .prepare(
      `SELECT id, status, payload, pdf_path, error, pending_interaction,
              created_at, updated_at
       FROM jobs WHERE id = ?`,
    )
    .get(id) as Record<string, unknown> | undefined;
  return row ? rowToJob(row) : null;
}

export function sqliteUpdateJobStatus(
  id: string,
  status: JobStatus,
  extra?: {
    pdf_path?: string | null;
    error?: string | null;
    pending_interaction?: PendingInteraction | null;
  },
): JobRecord | null {
  const current = sqliteGetJob(id);
  if (!current) return null;

  const pdfPath =
    extra && "pdf_path" in extra ? (extra.pdf_path ?? null) : current.pdf_path;
  const error =
    extra && "error" in extra ? (extra.error ?? null) : current.error;
  const pendingInteraction =
    extra && "pending_interaction" in extra
      ? (extra.pending_interaction ?? null)
      : current.pending_interaction;

  getSqlite()
    .prepare(
      `UPDATE jobs
       SET status = ?, pdf_path = ?, error = ?, pending_interaction = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
    )
    .run(
      status,
      pdfPath,
      error,
      pendingInteraction ? JSON.stringify(pendingInteraction) : null,
      id,
    );

  return sqliteGetJob(id);
}

export function migrateSqlite(): void {
  getSqlite();
  console.log(`SQLite ready at ${dbPath()}`);
}
