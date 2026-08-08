/**
 * LOCAL_STACK=true (default): SQLite + in-process queue/bus — no Docker/Redis/Postgres.
 * LOCAL_STACK=false: Postgres + Redis + BullMQ (docker compose / Homebrew).
 */
export function isLocalStack(): boolean {
  const raw = process.env.LOCAL_STACK?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no") return false;
  if (raw === "1" || raw === "true" || raw === "yes") return true;
  // Default on: machines without Docker can still run the MVP.
  return true;
}
