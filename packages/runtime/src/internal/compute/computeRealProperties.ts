import { isObject } from "@next-core/utils/general";
import { asyncComputeRealValue, computeRealValue } from "./computeRealValue.js";
import { TrackingContextItem } from "./listenOnTrackingContext.js";
import type { AsyncProperties, RuntimeContext } from "../interfaces.js";
import { StateOfUseBrick } from "./getNextStateOfUseBrick.js";
import { getTracks } from "./getTracks.js";

export function asyncComputeRealProperties(
  properties: Record<string, unknown> | undefined,
  runtimeContext: RuntimeContext,
  trackingContextList?: TrackingContextItem[]
): AsyncProperties {
  if (isObject(properties)) {
    return Object.fromEntries(
      Object.entries(properties).map<[string, Promise<unknown>]>(
        ([propName, propValue]) => {
          if (Array.isArray(trackingContextList)) {
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
      )
    );
  }

  return {};
}

export async function constructAsyncProperties(
  asyncProperties: AsyncProperties
): Promise<Record<string, unknown>> {
  return Object.fromEntries(
    (
      await Promise.all(
        Object.entries(asyncProperties).map(async ([propName, asyncValue]) => {
          const value = await asyncValue;
          // For `style` and `dataset`, only object is acceptable.
          if (
            (propName !== "style" && propName !== "dataset") ||
            isObject(value)
          ) {
            return [propName, value];
          }
        })
      )
    ).filter(Boolean) as [string, unknown][]
  );
}

export function computeRealProperties(
  properties: Record<string, unknown> | undefined,
  runtimeContext: RuntimeContext,
  trackingContextList?: TrackingContextItem[]
): Record<string, unknown> {
  if (isObject(properties)) {
    return Object.fromEntries(
      Object.entries(properties)
        .map<[string, unknown] | undefined>(([propName, propValue]) => {
          if (Array.isArray(trackingContextList)) {
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
          }
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
