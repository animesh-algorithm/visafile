import { createRequire } from "node:module";
import { LocalPdfStorage } from "./local.js";
import type { PdfStorage } from "./types.js";

let instance: PdfStorage | null = null;
const require = createRequire(import.meta.url);

/**
 * PDF_STORAGE=local|s3 (default: local)
 * For MinIO set PDF_STORAGE=s3 and S3_ENDPOINT=http://127.0.0.1:9000
 *
 * S3 is loaded only when selected so `PDF_STORAGE=local` can start without
 * `@aws-sdk/client-s3` installed.
 */
export function getPdfStorage(): PdfStorage {
  if (!instance) {
    const backend = (process.env.PDF_STORAGE ?? "local").trim().toLowerCase();
    if (backend === "s3" || backend === "minio") {
      instance = createS3Storage();
    } else {
      instance = new LocalPdfStorage();
    }
  }
  return instance;
}

function createS3Storage(): PdfStorage {
  try {
    const { S3PdfStorage } = require("./s3.ts") as {
      S3PdfStorage: new () => PdfStorage;
    };
    return new S3PdfStorage();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("@aws-sdk/client-s3") ||
      message.includes("Cannot find package")
    ) {
      throw new Error(
        "PDF_STORAGE is s3/minio but @aws-sdk/client-s3 is not installed. Set PDF_STORAGE=local or run npm install @aws-sdk/client-s3.",
      );
    }
    throw error;
  }
}

export type { PdfStorage } from "./types.js";
