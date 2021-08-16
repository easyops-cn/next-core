import { ProviderPollOptions } from "@next-core/brick-types";
import { _internalApiGetRouterRenderId } from "../core/Runtime";

export type PollableCallbackFunction = (result?: unknown) => unknown;

export interface PollableCallback {
  progress?: PollableCallbackFunction;
  success?: PollableCallbackFunction;
  error?: PollableCallbackFunction;
  finally?: PollableCallbackFunction;
}

const timeoutIdList = new Set<number>();

export function startPoll(
  task: () => unknown,
  { progress, success, error, finally: finallyCallback }: PollableCallback,
  {
    interval,
    leadingRequestDelay,
    continueOnError,
    delegateLoadingBar,
    expectPollEnd,
  }: ProviderPollOptions
): void {
  const currentRenderId = _internalApiGetRouterRenderId();
  let currentTimeoutId: number;
  async function poll(): Promise<void> {
    timeoutIdList.delete(currentTimeoutId);
    try {
      const result = await task();
      // Ignore when a different router is rendering after the task processed.
      if (currentRenderId === _internalApiGetRouterRenderId()) {
        progress?.(result);
        if (expectPollEnd?.(result)) {
          if (delegateLoadingBar) {
            window.dispatchEvent(new CustomEvent("request.end"));
          }
          success?.(result);
          finallyCallback?.();
        } else {
          delayedPoll(interval ?? 3000);
        }
      }
    } catch (e) {
      // Ignore when a different router is rendering after the task processed.
      if (currentRenderId === _internalApiGetRouterRenderId()) {
        error?.(e);
        if (continueOnError) {
          delayedPoll(interval ?? 3000);
        } else {
          finallyCallback?.();
        }
      }
    } finally {
      // Manually dispatch an event of `request.end` when a different router
      // is rendering after the task processed.
      if (
        delegateLoadingBar &&
        currentRenderId !== _internalApiGetRouterRenderId()
      ) {
        window.dispatchEvent(new CustomEvent("request.end"));
      }
    }
  }

  function delayedPoll(delay: number): void {
    currentTimeoutId = setTimeout(poll, delay) as unknown as number;
    timeoutIdList.add(currentTimeoutId);
  }

  delayedPoll(leadingRequestDelay ?? 0);

  if (delegateLoadingBar) {
    window.dispatchEvent(new CustomEvent("request.start"));
  }
}

export function clearPollTimeout(): void {
  for (const timeoutId of timeoutIdList) {
    clearTimeout(timeoutId);
  }
  timeoutIdList.clear();
}
