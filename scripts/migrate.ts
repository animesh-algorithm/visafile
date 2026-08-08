import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { isLocalStack } from "../shared/config.js";
import { migrateSqlite } from "../api/db/sqlite.js";

const sqlPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../api/db/migrate.sql",
);

async function main() {
  if (isLocalStack()) {
    migrateSqlite();
    console.log("Migration applied (SQLite / LOCAL_STACK).");
    return;
  }

  const databaseUrl =
    process.env.DATABASE_URL ??
    "postgres://ds160:ds160@127.0.0.1:5432/ds160";
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  const sql = await readFile(sqlPath, "utf8");
  await client.query(sql);
  await client.end();
  console.log("Migration applied (Postgres).");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
