import { setProperties } from "./setProperties.js";
import type { RuntimeBrick } from "../interfaces.js";
import { getTplStateStore } from "../CustomTemplates/utils.js";
import { getFormStateStore } from "../FormRenderer/utils.js";
import {
  getPreEvaluatedContext,
  getPreEvaluatedRaw,
  isPreEvaluated,
} from "./evaluate.js";

export interface TrackingContextItem {
  contextNames: string[] | Set<string> | false;
  stateNames: string[] | Set<string> | false;
  formStateNames: string[] | Set<string> | false;
  propName: string;
  propValue: unknown;
}

export function listenOnTrackingContext(
  brick: RuntimeBrick,
  trackingContextList: TrackingContextItem[]
): void {
  for (const {
    propName,
    propValue,
    contextNames,
    stateNames,
    formStateNames,
  } of trackingContextList) {
    const listener = (): void => {
      if (brick.element) {
        setProperties(
          brick.element,
          { [propName]: propValue },
          brick.runtimeContext
        );
      }
    };
    if (contextNames) {
      for (const contextName of contextNames) {
        brick.runtimeContext.ctxStore.onChange(contextName, listener);
      }
    }
    if (stateNames) {
      const tplStateStore = isPreEvaluated(propValue)
        ? getTplStateStore(
            getPreEvaluatedContext(propValue),
            "STATE",
            `: "${getPreEvaluatedRaw(propValue)}"`
          )
        : getTplStateStore(brick.runtimeContext, "STATE", `: "${propValue}"`);
      for (const stateName of stateNames) {
        tplStateStore.onChange(stateName, listener);
      }
    }
    if (formStateNames) {
      const formStateStore = isPreEvaluated(propValue)
        ? getFormStateStore(
            getPreEvaluatedContext(propValue),
            "FORM_STATE",
            `: "${getPreEvaluatedRaw(propValue)}"`
          )
        : getFormStateStore(
            brick.runtimeContext,
            "FORM_STATE",
            `: "${propValue}"`
          );
      for (const stateName of formStateNames) {
        formStateStore.onChange(stateName, listener);
      }
    }
  }
}
