import {
  PluginRuntimeContext,
  ProviderPollOptions,
} from "@next-core/brick-types";
import { pick } from "lodash";
import { _internalApiGetRouterRenderId } from "../core/Runtime";
import { computeRealValue } from "./setProperties";

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
  context: PluginRuntimeContext
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
      context
    ) as ProviderPollOptions;
  const currentRenderId = _internalApiGetRouterRenderId();
  let currentTimeoutId: number;
  async function poll(): Promise<void> {
    timeoutIdList.delete(currentTimeoutId);
    let shouldStop: boolean;
    try {
      shouldStop = (
        computeRealValue(expectPollStopImmediately, context) as () => boolean
      )?.();
      // Stop polling immediately when the expectation is match before task.
      if (!shouldStop) {
        const result = await task();
        // Stop polling immediately when the expectation is match or a different router
        // is rendering after the task processed.
        shouldStop =
          (
            computeRealValue(
              expectPollStopImmediately,
              context
            ) as () => boolean
          )?.() || currentRenderId !== _internalApiGetRouterRenderId();
        if (!shouldStop) {
          progress?.(result);
          const value = (
            computeRealValue(expectPollEnd, context) as (
              result: unknown
            ) => boolean
          )?.(result);
          if (value) {
            if (delegateLoadingBar) {
              window.dispatchEvent(new CustomEvent("request.end"));
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
          computeRealValue(expectPollStopImmediately, context) as () => boolean
        )?.() || currentRenderId !== _internalApiGetRouterRenderId();
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
