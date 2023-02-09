import { isObject } from "@next-core/utils/general";
import { isEvaluable } from "@next-core/cook";
import { track } from "@next-core/utils/storyboard";
import { asyncComputeRealValue, computeRealValue } from "./computeRealValue.js";
import {
  PreEvaluated,
  getPreEvaluatedRaw,
  isPreEvaluated,
} from "./evaluate.js";
import { TrackingContextItem } from "./listenOnTrackingContext.js";
import type { RuntimeContext } from "../interfaces.js";

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
            if (
              Array.isArray(trackingContextList) &&
              (typeof propValue === "string"
                ? isEvaluable(propValue)
                : isPreEvaluated(propValue))
            ) {
              const raw =
                typeof propValue === "string"
                  ? propValue
                  : getPreEvaluatedRaw(propValue as PreEvaluated);
              const contextNames = track(raw, "track context", "CTX");
              const stateNames = track(raw, "track state", "STATE");
              const formStateNames = track(
                raw,
                "track formstate",
                "FORM_STATE"
              );
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
            // Todo: lazyForUseBrick
            // Related: https://github.com/facebook/react/issues/11347
            const realValue = await asyncComputeRealValue(
              propValue,
              runtimeContext
            );
            if (realValue !== undefined) {
              // For `style` and `dataset`, only object is acceptable.
              if (
                (propName !== "style" && propName !== "dataset") ||
                isObject(realValue)
              ) {
                return [propName, realValue];
              }
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
          if (
            Array.isArray(trackingContextList) &&
            (typeof propValue === "string"
              ? isEvaluable(propValue)
              : isPreEvaluated(propValue))
          ) {
            const raw =
              typeof propValue === "string"
                ? propValue
                : getPreEvaluatedRaw(propValue as PreEvaluated);
            const contextNames = track(raw, "track context", "CTX");
            const stateNames = track(raw, "track state", "STATE");
            const formStateNames = track(raw, "track formstate", "FORM_STATE");
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
          // Todo: lazyForUseBrick
          // Related: https://github.com/facebook/react/issues/11347
          const realValue = computeRealValue(propValue, runtimeContext);
          if (realValue !== undefined) {
            // For `style` and `dataset`, only object is acceptable.
            if (
              (propName !== "style" && propName !== "dataset") ||
              isObject(realValue)
            ) {
              return [propName, realValue];
            }
          }
        })
        .filter(Boolean) as [string, unknown][]
    );
  }

  return {};
}
