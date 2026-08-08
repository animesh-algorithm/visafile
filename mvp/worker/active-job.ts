/** Currently executing job id (for shutdown / crash reporting). */
let activeJobId: string | null = null;

export function setActiveJobId(jobId: string | null): void {
  activeJobId = jobId;
}

export function getActiveJobId(): string | null {
  return activeJobId;
}
