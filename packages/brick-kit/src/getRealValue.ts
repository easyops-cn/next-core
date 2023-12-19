import { inject, isEvaluable, isObject } from "@next-core/brick-utils";
import { _internalApiGetCurrentContext } from "./core/exports";
import { evaluate } from "./internal/evaluate";
import { haveBeenInjected, recursiveMarkAsInjected } from "./internal/injected";
import { getHistory } from "./history";

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
  const ctx = {
    ..._internalApiGetCurrentContext(),
  };
  if (useRealTimeQuery) {
    ctx.query = new URLSearchParams(getHistory().location.search);
  }

  const compute = (data: unknown): unknown => {
    if (typeof data === "string") {
      if (isEvaluable(data)) {
        const result = evaluate(data, ctx);
        recursiveMarkAsInjected(result);
        return result;
      }
      return inject(data, ctx);
    }

    if (!isObject(data) || haveBeenInjected(value)) {
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
