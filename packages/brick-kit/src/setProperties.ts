import { set } from "lodash";
import { PluginRuntimeContext } from "@easyops/brick-types";
import { isObject, inject, isEvaluable } from "@easyops/brick-utils";
import {
  evaluate,
  EvaluateRuntimeContext,
  isPreEvaluated,
  shouldDismissRecursiveMarkingInjected,
} from "./evaluate";
import { haveBeenInjected, recursiveMarkAsInjected } from "./injected";

interface ComputeOptions {
  $$lazyForUseBrickEvents?: boolean;
  $$atUseBrickNow?: boolean;
  $$inUseBrickEventsNow?: boolean;
}

export const computeRealValue = (
  value: unknown,
  context: PluginRuntimeContext,
  injectDeep?: boolean,
  internalOptions?: ComputeOptions
): unknown => {
  const preEvaluated = isPreEvaluated(value);

  if (preEvaluated || typeof value === "string") {
    let result: unknown;
    let dismissRecursiveMarkingInjected = false;
    if (preEvaluated || isEvaluable(value as string)) {
      const runtimeContext: EvaluateRuntimeContext = {};
      if (context?.event) {
        runtimeContext.event = context.event;
      }
      if (context?.getTplVariables) {
        runtimeContext.getTplVariables = context.getTplVariables;
      }
      result = evaluate(value as string, runtimeContext, {
        lazy:
          internalOptions?.$$lazyForUseBrickEvents &&
          internalOptions.$$inUseBrickEventsNow,
      });
      dismissRecursiveMarkingInjected = shouldDismissRecursiveMarkingInjected(
        value as string
      );
    } else {
      result = inject(value as string, context);
    }
    if (!dismissRecursiveMarkingInjected) {
      recursiveMarkAsInjected(result);
    }
    return result;
  }

  let newValue = value;
  if (injectDeep && isObject(value)) {
    if (haveBeenInjected(value)) {
      return value;
    }
    if (Array.isArray(value)) {
      newValue = value.map((v) =>
        computeRealValue(v, context, injectDeep, internalOptions)
      );
    } else {
      newValue = Object.entries(value).reduce<Record<string, unknown>>(
        (acc, [k, v]) => {
          k = computeRealValue(k, context, false) as string;
          let newOptions = internalOptions;
          if (internalOptions?.$$lazyForUseBrickEvents) {
            newOptions = {
              ...internalOptions,
              $$atUseBrickNow: k === "useBrick",
              $$inUseBrickEventsNow:
                internalOptions.$$inUseBrickEventsNow ||
                (internalOptions.$$atUseBrickNow && k === "events"),
            };
          }
          acc[k] = computeRealValue(v, context, injectDeep, newOptions);
          return acc;
        },
        {}
      );
    }
  }

  return newValue;
};

export function setProperties(
  bricks: HTMLElement | HTMLElement[],
  properties: Record<string, unknown>,
  context: PluginRuntimeContext,
  injectDeep?: boolean
): void {
  const realProps = computeRealProperties(properties, context, injectDeep);
  if (!Array.isArray(bricks)) {
    bricks = [bricks];
  }
  bricks.forEach((brick) => {
    setRealProperties(brick, realProps);
  });
}

export function setRealProperties(
  brick: HTMLElement,
  realProps: Record<string, unknown>,
  extractProps?: boolean
): void {
  for (const [propName, propValue] of Object.entries(realProps)) {
    if (propName === "style") {
      for (const [styleName, styleValue] of Object.entries(propValue)) {
        ((brick.style as unknown) as Record<string, unknown>)[
          styleName
        ] = styleValue;
      }
    } else if (propName === "innerHTML") {
      // `innerHTML` is dangerous, use `textContent` instead.
      // eslint-disable-next-line no-console
      console.error("Please use `textContent` instead of `innerHTML`.");
      brick.textContent = propValue as string;
    } else {
      if (extractProps) {
        set(brick, propName, propValue);
      } else {
        ((brick as unknown) as Record<string, unknown>)[propName] = propValue;
      }
    }
  }
}

export function computeRealProperties(
  properties: Record<string, unknown>,
  context: PluginRuntimeContext,
  injectDeep?: boolean
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (isObject(properties)) {
    for (const [propName, propValue] of Object.entries(properties)) {
      // Related: https://github.com/facebook/react/issues/11347
      const realValue = computeRealValue(propValue, context, injectDeep, {
        $$lazyForUseBrickEvents: true,
        $$atUseBrickNow: propName === "useBrick",
      });
      if (realValue !== undefined) {
        // For `style`, only object is acceptable.
        if (propName !== "style" || isObject(realValue)) {
          result[propName] = realValue;
        }
      }
    }
  }

  return result;
}
