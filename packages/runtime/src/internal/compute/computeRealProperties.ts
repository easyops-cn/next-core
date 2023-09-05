import { isObject } from "@next-core/utils/general";
import { asyncComputeRealValue, computeRealValue } from "./computeRealValue.js";
import { TrackingContextItem } from "./listenOnTrackingContext.js";
import type { AsyncPropertyEntry, RuntimeContext } from "../interfaces.js";
import { StateOfUseBrick } from "./getNextStateOfUseBrick.js";
import { getTracks } from "./getTracks.js";

export function asyncComputeRealPropertyEntries(
  properties: Record<string, unknown> | undefined,
  runtimeContext: RuntimeContext,
  trackingContextList: TrackingContextItem[]
): AsyncPropertyEntry[] {
  if (isObject(properties)) {
    return Object.entries(properties).map<[string, Promise<unknown>]>(
      ([propName, propValue]) => {
        const { contextNames, stateNames, formStateNames } =
          getTracks(propValue);
        if (contextNames || stateNames || formStateNames) {
          trackingContextList.push({
            contextNames,
            stateNames,
            formStateNames,
            propName,
            propValue,
          });
        }
        // Related: https://github.com/facebook/react/issues/11347
        const asyncValue = asyncComputeRealValue(propValue, runtimeContext, {
          $$lazyForUseBrick: true,
          $$stateOfUseBrick:
            propName === "useBrick"
              ? StateOfUseBrick.USE_BRICK
              : StateOfUseBrick.INITIAL,
        });
        return [propName, asyncValue];
      }
    );
  }

  return [];
}

export async function computePropertyValue(
  asyncPropertyEntries: AsyncPropertyEntry[],
  propName: string
): Promise<unknown> {
  for (const [name, asyncValue, ignoreUndefined] of asyncPropertyEntries) {
    if (name === propName) {
      const value = await asyncValue;
      if (value !== undefined || !ignoreUndefined) {
        return value;
      }
    }
  }
}

export async function constructAsyncProperties(
  asyncPropertyEntries: AsyncPropertyEntry[]
): Promise<Record<string, unknown>> {
  const props: Record<string, unknown> = {};
  for (const [propName, asyncValue, ignoreUndefined] of asyncPropertyEntries) {
    const value = await asyncValue;
    if (
      (value !== undefined || !ignoreUndefined) &&
      // For `style` and `dataset`, only object is acceptable.
      ((propName !== "style" && propName !== "dataset") || isObject(value))
    ) {
      props[propName] = value;
    }
  }
  return props;
}

export function computeRealProperties(
  properties: Record<string, unknown> | undefined,
  runtimeContext: RuntimeContext
): Record<string, unknown> {
  if (isObject(properties)) {
    return Object.fromEntries(
      Object.entries(properties)
        .map<[string, unknown] | undefined>(([propName, propValue]) => {
          // Related: https://github.com/facebook/react/issues/11347
          const realValue = computeRealValue(propValue, runtimeContext, {
            $$lazyForUseBrick: true,
            $$stateOfUseBrick:
              propName === "useBrick"
                ? StateOfUseBrick.USE_BRICK
                : StateOfUseBrick.INITIAL,
          });
          // For `style` and `dataset`, only object is acceptable.
          if (
            (propName !== "style" && propName !== "dataset") ||
            isObject(realValue)
          ) {
            return [propName, realValue];
          }
        })
        .filter(Boolean) as [string, unknown][]
    );
  }

  return {};
}
