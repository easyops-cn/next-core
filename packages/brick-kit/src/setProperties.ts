import { set } from "lodash";
import { PluginRuntimeContext } from "@easyops/brick-types";
import { isObject, inject, isEvaluable } from "@easyops/brick-utils";
import { evaluate, isPreEvaluated } from "./evaluate";
import { haveBeenInjected, recursiveMarkAsInjected } from "./injected";

interface ComputeOptions {
  $$lazyForUseBrickEvents?: boolean;
  $$atUseBrickNow?: boolean;
  $$inUseBrickEventsNow?: boolean;
}

export const computeRealValue = (
  value: any,
  context: PluginRuntimeContext,
  injectDeep?: boolean,
  internalOptions?: ComputeOptions
): any => {
  const preEvaluated = isPreEvaluated(value);

  if (preEvaluated || typeof value === "string") {
    let result: any;
    if (preEvaluated || isEvaluable(value)) {
      const runtimeContext: any = {};
      if (context?.event) {
        runtimeContext.event = context.event;
      }
      result = evaluate(value, runtimeContext, {
        lazy:
          internalOptions?.$$lazyForUseBrickEvents &&
          internalOptions.$$inUseBrickEventsNow,
      });
    } else {
      result = inject(value, context);
    }
    recursiveMarkAsInjected(result);
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
      newValue = Object.entries(value).reduce<Record<string, any>>(
        (acc, [k, v]) => {
          k = computeRealValue(k, context, false);
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
  properties: Record<string, any>,
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
  realProps: Record<string, any>,
  extractProps?: boolean
): void {
  for (const [propName, propValue] of Object.entries(realProps)) {
    if (propName === "style") {
      for (const [styleName, styleValue] of Object.entries(propValue)) {
        (brick.style as any)[styleName] = styleValue;
      }
    } else if (propName === "innerHTML") {
      // `innerHTML` is dangerous, use `textContent` instead.
      // eslint-disable-next-line no-console
      console.error("Please use `textContent` instead of `innerHTML`.");
      brick.textContent = propValue;
    } else {
      if (extractProps) {
        set(brick, propName, propValue);
      } else {
        (brick as any)[propName] = propValue;
      }
    }
  }
}

export function computeRealProperties(
  properties: Record<string, any>,
  context: PluginRuntimeContext,
  injectDeep?: boolean
): any {
  const result: Record<string, any> = {};

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
