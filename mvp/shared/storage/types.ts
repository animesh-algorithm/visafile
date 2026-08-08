import type { Readable } from "node:stream";

/**
 * PDF object storage. Implementations: local filesystem, MinIO/S3.
 * Swap to Firebase later without changing callers.
 */
export interface PdfStorage {
  /** Upload a local file; returns a storage URI (file://… or s3://bucket/key). */
  put(jobId: string, localFilePath: string): Promise<string>;
  /** Whether the object exists. */
  exists(uri: string): Promise<boolean>;
  /** Open a readable stream for GET /jobs/:id/pdf. */
  openReadStream(uri: string): Promise<Readable>;
}
