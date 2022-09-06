import { set } from "lodash";
import { PluginRuntimeContext } from "@next-core/brick-types";
import {
  isObject,
  inject,
  isEvaluable,
  trackContext,
  trackState,
} from "@next-core/brick-utils";
import {
  evaluate,
  EvaluateRuntimeContext,
  isPreEvaluated,
  shouldDismissRecursiveMarkingInjected,
} from "./evaluate";
import { haveBeenInjected, recursiveMarkAsInjected } from "./injected";
import {
  getNextStateOfUseBrick,
  isLazyContentInUseBrick,
  StateOfUseBrick,
} from "./getNextStateOfUseBrick";
import { TrackingContextItem } from "./listenOnTrackingContext";
import { setupUseBrickInTemplate } from "../core/CustomTemplates/setupUseBrickInTemplate";

interface ComputeOptions {
  $$lazyForUseBrick?: boolean;
  $$stateOfUseBrick?: StateOfUseBrick;
  ignoreSymbols?: boolean;
}

export const computeRealValue = (
  value: unknown,
  context: PluginRuntimeContext,
  injectDeep?: boolean,
  internalOptions?: ComputeOptions
): unknown => {
  const preEvaluated = isPreEvaluated(value);

  if (preEvaluated || typeof value === "string") {
    // For `useBrick`, some fields such as `properties`/`transform`/`events`/`if`,
    // are kept and to be evaluated later.
    const lazy =
      internalOptions?.$$lazyForUseBrick &&
      isLazyContentInUseBrick(internalOptions.$$stateOfUseBrick);

    let result: unknown;
    let dismissRecursiveMarkingInjected = lazy;
    if (preEvaluated || isEvaluable(value as string)) {
      const runtimeContext: EvaluateRuntimeContext = {};
      const keys = [
        "event",
        "tplContextId",
        "overrideApp",
        "appendI18nNamespace",
        "formContextId",
      ] as const;
      for (const key of keys) {
        if (context?.[key]) {
          runtimeContext[key as "event"] = context[key as "event"];
        }
      }
      // The current runtime context is memoized even if the evaluation maybe lazy.
      result = evaluate(value as string, runtimeContext, { lazy });
      dismissRecursiveMarkingInjected = shouldDismissRecursiveMarkingInjected(
        value as string
      );
    } else {
      result = lazy ? value : inject(value as string, context);
    }
    if (!dismissRecursiveMarkingInjected) {
      recursiveMarkAsInjected(result);
    }
    return result;
  }

  if (!(injectDeep && isObject(value)) || haveBeenInjected(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    const nextOptions = getNextInternalOptions(internalOptions, true);
    return value.map((v) =>
      computeRealValue(v, context, injectDeep, nextOptions)
    );
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([k, v]) => [
        computeRealValue(k, context, false),
        computeRealValue(
          v,
          context,
          injectDeep,
          getNextInternalOptions(internalOptions, false, k)
        ),
      ])
      .concat(
        internalOptions?.ignoreSymbols
          ? []
          : Object.getOwnPropertySymbols(value).map((k) => [
              k,
              (value as Record<string | symbol, unknown>)[k],
            ])
      )
  );
};

export function setProperties(
  bricks: HTMLElement | HTMLElement[],
  properties: Record<string, unknown>,
  context: PluginRuntimeContext,
  injectDeep?: boolean
): void {
  const realProps = computeRealProperties(properties, context, injectDeep);
  if (context.tplContextId) {
    setupUseBrickInTemplate(realProps, {
      templateContextId: context.tplContextId,
    });
  }
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
    if (propName === "style" || propName === "dataset") {
      for (const [k, v] of Object.entries(propValue)) {
        (brick[propName] as unknown as Record<string, unknown>)[k] = v;
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
        (brick as unknown as Record<string, unknown>)[propName] = propValue;
      }
    }
  }
}

export function computeRealProperties(
  properties: Record<string, unknown>,
  context: PluginRuntimeContext,
  injectDeep?: boolean,
  trackingContextList?: TrackingContextItem[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (isObject(properties)) {
    for (const [propName, propValue] of Object.entries(properties)) {
      // Related: https://github.com/facebook/react/issues/11347
      const realValue = computeRealValue(propValue, context, injectDeep, {
        $$lazyForUseBrick: true,
        $$stateOfUseBrick:
          propName === "useBrick"
            ? StateOfUseBrick.USE_BRICK
            : StateOfUseBrick.INITIAL,
      });
      if (realValue !== undefined) {
        // For `style` and `dataset`, only object is acceptable.
        if (
          (propName !== "style" && propName !== "dataset") ||
          isObject(realValue)
        ) {
          result[propName] = realValue;
        }
      }
      if (Array.isArray(trackingContextList) && isEvaluable(propValue)) {
        const contextNames = trackContext(propValue);
        const stateNames = trackState(propValue);
        if (contextNames || stateNames) {
          trackingContextList.push({
            contextNames,
            stateNames,
            propName,
            propValue,
          });
        }
      }
    }
  }

  return result;
}

function getNextInternalOptions(
  internalOptions: ComputeOptions,
  isArray: boolean,
  key?: string
): ComputeOptions {
  return internalOptions?.$$lazyForUseBrick
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
