import { isEvaluable } from "@next-core/cook";
import { inject } from "@next-core/inject";
import { isObject } from "@next-core/utils/general";
import { getHistory } from "./index.js";
import { _internalApiGetRuntimeContext } from "./internal/Runtime.js";
import { evaluate } from "./internal/compute/evaluate.js";
import type { RuntimeContext } from "./internal/interfaces.js";
import {
  hasBeenComputed,
  markAsComputed,
} from "./internal/compute/markAsComputed.js";

/**
 * An equivalent of `computeRealValue` but for external usages, with no custom
 * context or options.
 *
 * @param value - Any value which may contains evaluations or placeholders.
 * @returns Computed real value.
 */
export function getRealValue(
  value: unknown,
  {
    useRealTimeQuery,
  }: {
    useRealTimeQuery?: boolean;
  } = {}
): unknown {
  const ctx: RuntimeContext = {
    ..._internalApiGetRuntimeContext()!,
  };
  if (useRealTimeQuery) {
    ctx.query = new URLSearchParams(getHistory().location.search);
  }

  const compute = (data: unknown): unknown => {
    if (typeof data === "string") {
      if (isEvaluable(data)) {
        const result = evaluate(data, ctx);
        markAsComputed(result);
        return result;
      }
      return inject(data, ctx);
    }

    if (!isObject(data) || hasBeenComputed(value)) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((v) => compute(v));
    }

    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [compute(k), compute(v)])
    );
  };

  return compute(value);
}
