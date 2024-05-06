import { _internalApiGetRenderId } from "./Runtime.js";
import type { PollableCallback } from "./poll.js";

export async function startSSEStream(
  task: () => Promise<AsyncIterable<unknown>>,
  { progress, success, error, finally: finallyCallback }: PollableCallback
) {
  const currentRenderId = _internalApiGetRenderId();
  try {
    const stream = await task();
    for await (const value of stream) {
      if (currentRenderId !== _internalApiGetRenderId()) {
        return;
      }
      progress?.(value);
    }
    if (currentRenderId !== _internalApiGetRenderId()) {
      return;
    }
    success?.();
  } catch (e) {
    if (currentRenderId !== _internalApiGetRenderId()) {
      return;
    }
    error?.(e);
  } finally {
    finallyCallback?.();
  }
}
