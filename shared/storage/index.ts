import { LocalPdfStorage } from "./local.js";
import { S3PdfStorage } from "./s3.js";
import type { PdfStorage } from "./types.js";

let instance: PdfStorage | null = null;

/**
 * PDF_STORAGE=local|s3 (default: local)
 * For MinIO set PDF_STORAGE=s3 and S3_ENDPOINT=http://127.0.0.1:9000
 */
export function getPdfStorage(): PdfStorage {
  if (!instance) {
    const backend = (process.env.PDF_STORAGE ?? "local").trim().toLowerCase();
    if (backend === "s3" || backend === "minio") {
      instance = new S3PdfStorage();
    } else {
      instance = new LocalPdfStorage();
    }
  }
  return instance;
}

export type { PdfStorage } from "./types.js";
