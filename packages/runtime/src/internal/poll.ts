import type { ProviderPollOptions } from "@next-core/types";
import { pick } from "lodash";
import { _internalApiGetRenderId } from "./Runtime.js";
import { computeRealValue } from "./compute/computeRealValue.js";
import { RuntimeContext } from "./interfaces.js";

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
  pollOptions: ProviderPollOptions,
  runtimeContext: RuntimeContext
): void {
  const { expectPollStopImmediately, expectPollEnd } = pollOptions;
  const { interval, leadingRequestDelay, continueOnError, delegateLoadingBar } =
    computeRealValue(
      pick(pollOptions, [
        "interval",
        "leadingRequestDelay",
        "continueOnError",
        "delegateLoadingBar",
      ]),
      runtimeContext
    ) as ProviderPollOptions;
  const currentRenderId = _internalApiGetRenderId();
  let currentTimeoutId: number;
  async function poll(): Promise<void> {
    timeoutIdList.delete(currentTimeoutId);
    let shouldStop: boolean | undefined;
    try {
      shouldStop = (
        computeRealValue(expectPollStopImmediately, runtimeContext) as
          | (() => boolean)
          | undefined
      )?.();
      // Stop polling immediately when the expectation is match before task.
      if (!shouldStop) {
        const result = await task();
        // Stop polling immediately when the expectation is match or a different router
        // is rendering after the task processed.
        shouldStop =
          (
            computeRealValue(expectPollStopImmediately, runtimeContext) as
              | (() => boolean)
              | undefined
          )?.() || currentRenderId !== _internalApiGetRenderId();
        if (!shouldStop) {
          progress?.(result);
          if (
            (
              computeRealValue(expectPollEnd, runtimeContext) as
                | ((result: unknown) => boolean)
                | undefined
            )?.(result)
          ) {
            if (delegateLoadingBar) {
              window.dispatchEvent(new Event("request.end"));
            }
            success?.(result);
            finallyCallback?.();
          } else {
            delayedPoll(interval ?? 3000);
          }
        }
      }
    } catch (e) {
      // Stop polling immediately when the expectation is match or a different router
      // is rendering after the task processed.
      shouldStop =
        (
          computeRealValue(expectPollStopImmediately, runtimeContext) as
            | (() => boolean)
            | undefined
        )?.() || currentRenderId !== _internalApiGetRenderId();
      if (!shouldStop) {
        error?.(e);
        if (continueOnError) {
          delayedPoll(interval ?? 3000);
        } else {
          finallyCallback?.();
        }
      }
    } finally {
      // Manually dispatch an event of `request.end` when the polling is stopped immediately.
      if (delegateLoadingBar && shouldStop) {
        window.dispatchEvent(new Event("request.end"));
      }
    }
  }

  function delayedPoll(delay: number): void {
    currentTimeoutId = setTimeout(poll, delay) as unknown as number;
    timeoutIdList.add(currentTimeoutId);
  }

  delayedPoll(leadingRequestDelay ?? 0);

  if (delegateLoadingBar) {
    window.dispatchEvent(new Event("request.start"));
  }
}

export function clearPollTimeout(): void {
  for (const timeoutId of timeoutIdList) {
    clearTimeout(timeoutId);
  }
  timeoutIdList.clear();
}
