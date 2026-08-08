import { createReadStream } from "node:fs";
import { access, copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import type { PdfStorage } from "./types.js";
import { MVP_ROOT } from "../workspace.js";

function storageRoot(): string {
  const fromEnv = process.env.PDF_LOCAL_DIR?.trim();
  return fromEnv
    ? resolve(MVP_ROOT, fromEnv)
    : resolve(MVP_ROOT, "data/pdf-store");
}

export class LocalPdfStorage implements PdfStorage {
  async put(jobId: string, localFilePath: string): Promise<string> {
    const dest = resolve(storageRoot(), `${jobId}.pdf`);
    await mkdir(dirname(dest), { recursive: true, mode: 0o700 });
    await copyFile(localFilePath, dest);
    return `file://${dest}`;
  }

  async exists(uri: string): Promise<boolean> {
    try {
      await access(uriToPath(uri));
      return true;
    } catch {
      return false;
    }
  }

  async openReadStream(uri: string): Promise<Readable> {
    return createReadStream(uriToPath(uri));
  }
}

function uriToPath(uri: string): string {
  if (uri.startsWith("file://")) {
    return fileURLToPath(uri);
  }
  return uri;
}
