import { isEvaluable } from "@next-core/cook";
import { isObject } from "@next-core/utils/general";
import { transformAndInject } from "@next-core/inject";
import { RuntimeContext } from "@next-core/brick-types";
import { evaluate, isPreEvaluated, syncEvaluate } from "./evaluate.js";

export async function computeRealValue(
  value: unknown,
  runtimeContext: RuntimeContext
): Promise<unknown> {
  const preEvaluated = isPreEvaluated(value);

  if (preEvaluated || typeof value === "string") {
    let result: unknown;

    if (preEvaluated || isEvaluable(value as string)) {
      result = await evaluate(value, runtimeContext);
    } else {
      result = transformAndInject(value, runtimeContext);
    }

    return result;
  }

  if (!isObject(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map((v) => computeRealValue(v, runtimeContext)));
  }

  return Object.fromEntries(
    (
      await Promise.all(
        Object.entries(value).map(([k, v]) =>
          Promise.all([
            computeRealValue(k, runtimeContext),
            computeRealValue(v, runtimeContext),
          ])
        )
      )
    ).concat(
      Object.getOwnPropertySymbols(value).map((k) => [
        k,
        (value as Record<string | symbol, unknown>)[k],
      ])
    )
  );
}

export function syncComputeRealValue(
  value: unknown,
  runtimeContext: RuntimeContext
): unknown {
  const preEvaluated = isPreEvaluated(value);

  if (preEvaluated || typeof value === "string") {
    let result: unknown;

    if (preEvaluated || isEvaluable(value as string)) {
      result = syncEvaluate(value, runtimeContext);
    } else {
      result = transformAndInject(value, runtimeContext);
    }

    return result;
  }

  if (!isObject(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((v) => syncComputeRealValue(v, runtimeContext));
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([k, v]) => [
        syncComputeRealValue(k, runtimeContext),
        syncComputeRealValue(v, runtimeContext),
      ])
      .concat(
        Object.getOwnPropertySymbols(value).map((k) => [
          k,
          (value as Record<string | symbol, unknown>)[k],
        ])
      )
  );
}
