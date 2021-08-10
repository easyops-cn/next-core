export async function resolveSequenceJobs(
  asyncJobs: Promise<unknown>[]
): Promise<void> {
  for (const job of asyncJobs) {
    await job;
  }
}
