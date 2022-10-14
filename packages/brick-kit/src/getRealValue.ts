import type { PluginRuntimeContext } from "@next-core/brick-types";
import { inject, isEvaluable, isObject } from "@next-core/brick-utils";
import { _internalApiGetCurrentContext } from "./core/exports";
import { evaluate } from "./internal/evaluate";
import { haveBeenInjected, recursiveMarkAsInjected } from "./internal/injected";

/**
 * An equivalent of `computeRealValue` but for external usages, with no custom
 * context or options.
 *
 * @param value - Any value which may contains evaluations or placeholders.
 * @returns Computed real value.
 */
export function getRealValue(value: unknown): unknown {
  const compute = (data: unknown, ctx: PluginRuntimeContext): unknown => {
    if (typeof data === "string") {
      if (isEvaluable(data)) {
        const result = evaluate(data);
        recursiveMarkAsInjected(result);
        return result;
      }
      return inject(data, ctx);
    }

    if (!isObject(data) || haveBeenInjected(value)) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((v) => compute(v, ctx));
    }

    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [compute(k, ctx), compute(v, ctx)])
    );
  };

  return compute(value, _internalApiGetCurrentContext());
}
