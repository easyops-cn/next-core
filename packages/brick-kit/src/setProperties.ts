import { set } from "lodash";
import { PluginRuntimeContext } from "@next-core/brick-types";
import {
  isObject,
  inject,
  isEvaluable,
  trackContext,
} from "@next-core/brick-utils";
import {
  evaluate,
  EvaluateRuntimeContext,
  isPreEvaluated,
  shouldDismissRecursiveMarkingInjected,
} from "./evaluate";
import { haveBeenInjected, recursiveMarkAsInjected } from "./injected";

interface ComputeOptions {
  $$lazyForUseBrickEvents?: boolean;
  $$stateOfUseBrick?: StateOfUseBrick;
}

enum StateOfUseBrick {
  INITIAL,
  USE_BRICK,
  USE_BRICK_ITEM,
  USE_BRICK_EVENTS,
  USE_BRICK_SLOTS,
  USE_BRICK_SLOTS_ITEM,
  USE_BRICK_SLOTS_ITEM_BRICKS,
  USE_BRICK_SLOTS_ITEM_BRICKS_ITEM,
}

export interface TrackingContextItem {
  contextNames: string[];
  propName: string;
  propValue: string;
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
      const keys = ["event", "getTplVariables", "overrideApp"] as const;
      for (const key of keys) {
        if (context?.[key]) {
          runtimeContext[key as "event"] = context[key as "event"];
        }
      }
      result = evaluate(value as string, runtimeContext, {
        lazy:
          internalOptions?.$$lazyForUseBrickEvents &&
          internalOptions.$$stateOfUseBrick ===
            StateOfUseBrick.USE_BRICK_EVENTS,
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
      const nextOptions = getNextInternalOptions(internalOptions, true);
      newValue = value.map((v) =>
        computeRealValue(v, context, injectDeep, nextOptions)
      );
    } else {
      newValue = Object.entries(value).reduce<Record<string, unknown>>(
        (acc, [k, v]) => {
          k = computeRealValue(k, context, false) as string;
          acc[k] = computeRealValue(
            v,
            context,
            injectDeep,
            getNextInternalOptions(internalOptions, false, k)
          );
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
        $$lazyForUseBrickEvents: true,
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
        if (contextNames) {
          trackingContextList.push({
            contextNames,
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
  return internalOptions?.$$lazyForUseBrickEvents
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

function getNextStateOfUseBrick(
  state: StateOfUseBrick,
  isArray?: boolean,
  key?: string
): StateOfUseBrick {
  if (state === StateOfUseBrick.USE_BRICK_EVENTS) {
    return state;
  }
  if (isArray) {
    switch (state) {
      case StateOfUseBrick.USE_BRICK:
        return StateOfUseBrick.USE_BRICK_ITEM;
      case StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS:
        return StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS_ITEM;
    }
  } else {
    switch (state) {
      case StateOfUseBrick.INITIAL:
        if (key === "useBrick") {
          return StateOfUseBrick.USE_BRICK;
        }
        break;
      case StateOfUseBrick.USE_BRICK:
      case StateOfUseBrick.USE_BRICK_ITEM:
      case StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS_ITEM: {
        switch (key) {
          case "events":
            return StateOfUseBrick.USE_BRICK_EVENTS;
          case "slots":
            return StateOfUseBrick.USE_BRICK_SLOTS;
        }
        break;
      }
      case StateOfUseBrick.USE_BRICK_SLOTS:
        return StateOfUseBrick.USE_BRICK_SLOTS_ITEM;
      case StateOfUseBrick.USE_BRICK_SLOTS_ITEM:
        if (key === "bricks") {
          return StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS;
        }
        break;
    }
  }
  return StateOfUseBrick.INITIAL;
}
