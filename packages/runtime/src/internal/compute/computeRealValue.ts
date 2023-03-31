import { isEvaluable } from "@next-core/cook";
import { isObject } from "@next-core/utils/general";
import { transformAndInject, transform } from "@next-core/inject";
import {
  asyncEvaluate,
  isPreEvaluated,
  evaluate,
  shouldDismissMarkingComputed,
} from "./evaluate.js";
import type { RuntimeContext } from "../interfaces.js";
import {
  StateOfUseBrick,
  getNextStateOfUseBrick,
  isLazyContentInUseBrick,
} from "./getNextStateOfUseBrick.js";
import { hasBeenComputed, markAsComputed } from "./markAsComputed.js";

export interface ComputeOptions {
  $$lazyForUseBrick?: boolean;
  $$stateOfUseBrick?: StateOfUseBrick;
  ignoreSymbols?: boolean;
  noInject?: boolean;
}

export async function asyncComputeRealValue(
  value: unknown,
  runtimeContext: RuntimeContext,
  internalOptions: ComputeOptions = {}
): Promise<unknown> {
  const preEvaluated = isPreEvaluated(value);

  if (preEvaluated || typeof value === "string") {
    // For `useBrick`, some fields such as `properties`/`transform`/`events`/`if`,
    // are kept and to be evaluated later.
    const lazy =
      internalOptions.$$lazyForUseBrick &&
      isLazyContentInUseBrick(internalOptions.$$stateOfUseBrick);

    let result: unknown;
    let dismissMarkingComputed = lazy;

    if (preEvaluated || isEvaluable(value as string)) {
      result = await asyncEvaluate(value, runtimeContext, { lazy });
      dismissMarkingComputed = shouldDismissMarkingComputed(value);
    } else {
      result = lazy
        ? value
        : (internalOptions.noInject ? transform : transformAndInject)(
            value,
            runtimeContext
          );
    }

    if (!dismissMarkingComputed) {
      markAsComputed(result);
    }

    return result;
  }

  if (!isObject(value) || hasBeenComputed(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    const nextOptions = getNextComputeOptions(internalOptions, true);
    return Promise.all(
      value.map((v) => asyncComputeRealValue(v, runtimeContext, nextOptions))
    );
  }

  return Object.fromEntries(
    (
      await Promise.all(
        Object.entries(value).map(([k, v]) =>
          Promise.all([
            asyncComputeRealValue(k, runtimeContext),
            asyncComputeRealValue(
              v,
              runtimeContext,
              getNextComputeOptions(internalOptions, false, k)
            ),
          ])
        )
      )
    ).concat(
      internalOptions.ignoreSymbols
        ? []
        : Object.getOwnPropertySymbols(value).map((k) => [
            k,
            (value as Record<string | symbol, unknown>)[k],
          ])
    )
  );
}

export function computeRealValue(
  value: unknown,
  runtimeContext: RuntimeContext,
  internalOptions: ComputeOptions = {}
): unknown {
  const preEvaluated = isPreEvaluated(value);

  if (preEvaluated || typeof value === "string") {
    // For `useBrick`, some fields such as `properties`/`transform`/`events`/`if`,
    // are kept and to be evaluated later.
    const lazy =
      internalOptions.$$lazyForUseBrick &&
      isLazyContentInUseBrick(internalOptions.$$stateOfUseBrick);

    let result: unknown;
    let dismissMarkingComputed = lazy;

    if (preEvaluated || isEvaluable(value as string)) {
      result = evaluate(value, runtimeContext);
      dismissMarkingComputed = shouldDismissMarkingComputed(value);
    } else {
      result = lazy ? value : transformAndInject(value, runtimeContext);
    }

    if (!dismissMarkingComputed) {
      markAsComputed(result);
    }

    return result;
  }

  if (!isObject(value) || hasBeenComputed(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    const nextOptions = getNextComputeOptions(internalOptions, true);
    return value.map((v) => computeRealValue(v, runtimeContext, nextOptions));
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([k, v]) => [
        computeRealValue(k, runtimeContext),
        computeRealValue(
          v,
          runtimeContext,
          getNextComputeOptions(internalOptions, false, k)
        ),
      ])
      .concat(
        internalOptions.ignoreSymbols
          ? []
          : Object.getOwnPropertySymbols(value).map((k) => [
              k,
              (value as Record<string | symbol, unknown>)[k],
            ])
      )
  );
}

function getNextComputeOptions(
  internalOptions: ComputeOptions,
  isArray: boolean,
  key?: string
): ComputeOptions {
  return internalOptions.$$lazyForUseBrick
    ? {
        ...internalOptions,
        $$stateOfUseBrick: getNextStateOfUseBrick(
          internalOptions.$$stateOfUseBrick,
          isArray,
          key
        ),
      }
    : internalOptions;
}
