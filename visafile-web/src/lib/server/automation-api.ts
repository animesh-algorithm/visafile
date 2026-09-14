import "server-only";

const DEFAULT_AUTOMATION_API_URL = "http://127.0.0.1:3001";

export interface AutomationStatus {
  jobId: string;
  status:
    | "queued"
    | "filling"
    | "awaiting_captcha"
    | "awaiting_correction"
    | "submitting"
    | "completed"
    | "failed";
  pdfPath: string | null;
  error: string | null;
  pendingInteraction:
    | { type: "captcha"; imageBase64: string }
    | {
        type: "correction";
        errors: Array<{
          message: string;
          field?: string;
          schemaPath?: string;
          kind?: "text" | "select" | "radio" | "checkbox";
        }>;
      }
    | null;
  createdAt: string;
  updatedAt: string;
}

function endpoint(path: string) {
  const base =
    process.env.AUTOMATION_API_URL?.trim() || DEFAULT_AUTOMATION_API_URL;
  return `${base.replace(/\/$/, "")}${path}`;
}

function headers(hasBody = false) {
  const result: Record<string, string> = {};
  const token = process.env.AUTOMATION_API_TOKEN?.trim();
  if (token) result.Authorization = `Bearer ${token}`;
  if (hasBody) result["Content-Type"] = "application/json";
  return result;
}

function unreachableAutomationMessage(error: unknown) {
  const cause =
    error instanceof Error && error.cause instanceof Error
      ? error.cause
      : error instanceof Error
        ? error
        : null;
  const code =
    cause && "code" in cause && typeof cause.code === "string"
      ? cause.code
      : "";
  if (
    code === "ECONNREFUSED" ||
    (error instanceof Error && error.message === "fetch failed")
  ) {
    return `Could not reach the automation service at ${endpoint("")}. Start it with npm run dev:api from the mvp folder.`;
  }
  if (error instanceof Error && error.name === "TimeoutError") {
    return "The automation service did not respond in time.";
  }
  return error instanceof Error ? error.message : "Automation request failed.";
}

async function checkedFetch(path: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(endpoint(path), {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new Error(unreachableAutomationMessage(error), { cause: error });
  }
  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  > & {
    error?: string;
    details?: string[];
  };
  if (!response.ok) {
    const details = body.details?.slice(0, 5).join("; ");
    throw new Error(
      details || body.error || `Automation service returned ${response.status}`,
    );
  }
  return body;
}

export async function createAutomationJob(
  application: Record<string, unknown>,
) {
  const body = await checkedFetch("/jobs", {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify(application),
  });
  if (!("jobId" in body) || typeof body.jobId !== "string") {
    throw new Error("Automation service did not return a job ID.");
  }
  return body.jobId;
}

export async function getAutomationStatus(jobId: string) {
  return (await checkedFetch(`/jobs/${encodeURIComponent(jobId)}`, {
    headers: headers(),
  })) as unknown as AutomationStatus;
}

export async function sendCaptchaAnswer(jobId: string, answer: string) {
  await checkedFetch(`/jobs/${encodeURIComponent(jobId)}/captcha`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ answer }),
  });
}

export async function sendCorrections(
  jobId: string,
  corrections: Array<Record<string, unknown>>,
) {
  await checkedFetch(`/jobs/${encodeURIComponent(jobId)}/corrections`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ corrections }),
  });
}

export function automationPdfUrl(jobId: string) {
  return endpoint(`/jobs/${encodeURIComponent(jobId)}/pdf`);
}

export async function downloadAutomationPdf(jobId: string) {
  return fetch(automationPdfUrl(jobId), {
    headers: headers(),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
}
