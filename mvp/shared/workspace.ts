import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Ds160Application } from "./schema/ds160-application.js";
import { DS160_SECTION_FIXTURES } from "./schema/ds160-application.js";

const MVP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function getWorkspaceRoot(): string {
  const fromEnv = process.env.WORKSPACE_ROOT?.trim();
  if (fromEnv) {
    return resolve(MVP_ROOT, fromEnv);
  }
  return resolve(MVP_ROOT, "workspaces");
}

export function jobWorkspacePath(jobId: string): string {
  return resolve(getWorkspaceRoot(), jobId);
}

/**
 * Materialize a Ds160Application into per-page fixture files the runner reads.
 * Returns the absolute workspace directory.
 */
export async function materializeJobWorkspace(
  jobId: string,
  application: Ds160Application,
): Promise<string> {
  const workspace = jobWorkspacePath(jobId);
  await mkdir(resolve(workspace, "fixtures"), { recursive: true, mode: 0o700 });
  await mkdir(resolve(workspace, "data"), { recursive: true, mode: 0o700 });

  for (const [sectionKey, relativePath] of Object.entries(
    DS160_SECTION_FIXTURES,
  )) {
    const data = application[sectionKey as keyof typeof DS160_SECTION_FIXTURES];
    if (data === undefined) continue;
    // relativePath is like "fixtures/personal-information-1.test.json"
    const outPath = resolve(workspace, relativePath);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, `${JSON.stringify(data, null, 2)}\n`, {
      mode: 0o600,
    });
  }

  if (application.meta.applicationId) {
    await writeFile(
      resolve(workspace, "data/session.json"),
      `${JSON.stringify(
        {
          applicationId: application.meta.applicationId,
          savedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      { mode: 0o600 },
    );
  }

  await writeFile(
    resolve(workspace, "data/job-meta.json"),
    `${JSON.stringify(application.meta, null, 2)}\n`,
    { mode: 0o600 },
  );

  return workspace;
}

export { MVP_ROOT };
