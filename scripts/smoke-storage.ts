import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { getPdfStorage } from "../shared/storage/index.js";

async function main() {
  mkdirSync("data/tmp", { recursive: true });
  const local = resolve("data/tmp/test.pdf");
  writeFileSync(local, "%PDF-1.4 test");
  const storage = getPdfStorage();
  const uri = await storage.put("test-job", local);
  console.log("uri", uri);
  console.log("exists", await storage.exists(uri));
  const stream = await storage.openReadStream(uri);
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(Buffer.from(c));
  console.log("bytes", Buffer.concat(chunks).length);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
