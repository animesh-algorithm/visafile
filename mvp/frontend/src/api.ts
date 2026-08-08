import type { Ds160Application, JobStatus } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3001";

export function getApiUrl(): string {
  return API_URL.replace(/\/$/, "");
}

export function getWsUrl(jobId: string): string {
  return `${WS_URL.replace(/\/$/, "")}/ws?jobId=${encodeURIComponent(jobId)}`;
}

export async function createJob(
  application: Ds160Application,
): Promise<{ jobId: string }> {
  const res = await fetch(`${getApiUrl()}/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(application),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.details?.join?.("\n") || data.error || `HTTP ${res.status}`,
    );
  }
  return data;
}

export async function getJob(jobId: string): Promise<{
  jobId: string;
  status: JobStatus;
  pdfPath: string | null;
  error: string | null;
  payload?: Ds160Application;
}> {
  const res = await fetch(`${getApiUrl()}/jobs/${jobId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export function pdfUrl(jobId: string): string {
  return `${getApiUrl()}/jobs/${jobId}/pdf`;
}
