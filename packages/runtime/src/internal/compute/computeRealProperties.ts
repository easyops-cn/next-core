import { isObject } from "@next-core/utils/general";
import { asyncComputeRealValue, computeRealValue } from "./computeRealValue.js";
import { TrackingContextItem } from "./listenOnTrackingContext.js";
import type { RuntimeContext } from "../interfaces.js";
import { StateOfUseBrick } from "./getNextStateOfUseBrick.js";
import { getTracks } from "./getTracks.js";

export async function asyncComputeRealProperties(
  properties: Record<string, unknown> | undefined,
  runtimeContext: RuntimeContext,
  trackingContextList?: TrackingContextItem[]
): Promise<Record<string, unknown>> {
  if (isObject(properties)) {
    return Object.fromEntries(
      (
        await Promise.all(
          Object.entries(properties).map<
            Promise<[string, unknown] | undefined>
          >(async ([propName, propValue]) => {
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
            const realValue = await asyncComputeRealValue(
              propValue,
              runtimeContext,
              {
                $$lazyForUseBrick: true,
                $$stateOfUseBrick:
                  propName === "useBrick"
                    ? StateOfUseBrick.USE_BRICK
                    : StateOfUseBrick.INITIAL,
              }
            );
            // For `style` and `dataset`, only object is acceptable.
            if (
              (propName !== "style" && propName !== "dataset") ||
              isObject(realValue)
            ) {
              return [propName, realValue];
            }
          })
        )
      ).filter(Boolean) as [string, unknown][]
    );
  }

  return {};
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
