import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import type { PdfStorage } from "./types.js";

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env ${name} for S3/MinIO storage`);
  return v;
}

export class S3PdfStorage implements PdfStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT?.trim();
    this.bucket = required("S3_BUCKET");
    this.client = new S3Client({
      region: process.env.S3_REGION?.trim() || "us-east-1",
      endpoint: endpoint || undefined,
      forcePathStyle: Boolean(endpoint),
      credentials: {
        accessKeyId: required("S3_ACCESS_KEY"),
        secretAccessKey: required("S3_SECRET_KEY"),
      },
    });
  }

  private key(jobId: string): string {
    const prefix = process.env.S3_PREFIX?.trim() || "confirmations";
    return `${prefix.replace(/\/$/, "")}/${jobId}.pdf`;
  }

  async put(jobId: string, localFilePath: string): Promise<string> {
    const Key = this.key(jobId);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key,
        Body: createReadStream(localFilePath),
        ContentType: "application/pdf",
      }),
    );
    return `s3://${this.bucket}/${Key}`;
  }

  private parseUri(uri: string): { bucket: string; key: string } {
    if (!uri.startsWith("s3://")) {
      throw new Error(`Not an s3 URI: ${uri}`);
    }
    const without = uri.slice("s3://".length);
    const slash = without.indexOf("/");
    return {
      bucket: without.slice(0, slash),
      key: without.slice(slash + 1),
    };
  }

  async exists(uri: string): Promise<boolean> {
    const { bucket, key } = this.parseUri(uri);
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async openReadStream(uri: string): Promise<Readable> {
    const { bucket, key } = this.parseUri(uri);
    const out = await this.client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const body = out.Body;
    if (!body) throw new Error(`Empty S3 object: ${uri}`);
    // AWS SDK v3 returns a web/node readable
    return body as unknown as Readable;
  }
}
