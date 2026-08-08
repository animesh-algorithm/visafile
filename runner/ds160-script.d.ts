import type { Ds160Application } from "../shared/schema/ds160-application.js";
import type { Ds160JobHooks, RunDs160JobResult } from "../shared/types.js";

export function runDs160Job(
  jobData: Ds160Application | null | undefined,
  hooks?: Partial<Ds160JobHooks>,
): Promise<RunDs160JobResult>;

export {
  configureJobContext,
  jobContext,
  workspacePath,
} from "./job-context.js";
