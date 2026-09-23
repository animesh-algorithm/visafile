import { isLocalStack } from "../../shared/config.js";
import { getPool } from "./client.js";
import { getSqlite } from "./sqlite.js";
import type { JobStatus } from "../../shared/types.js";

const STUCK: JobStatus[] = [
  "queued",
  "filling",
  "awaiting_browser_check",
  "awaiting_captcha",
  "awaiting_correction",
  "submitting",
];

/**
 * Jobs still open in the DB (queued or mid-flight). Cleared on worker start
 * so leftover Redis/BullMQ work is not resumed after a restart.
 */
export async function listStuckJobIds(): Promise<string[]> {
  if (isLocalStack()) {
    const rows = getSqlite()
      .prepare(
        `SELECT id FROM jobs WHERE status IN (${STUCK.map(() => "?").join(",")})`,
      )
      .all(...STUCK) as Array<{ id: string }>;
    return rows.map((r) => r.id);
  }

  const { rows } = await getPool().query<{ id: string }>(
    `SELECT id FROM jobs WHERE status = ANY($1::text[])`,
    [STUCK],
  );
  return rows.map((r) => r.id);
}
