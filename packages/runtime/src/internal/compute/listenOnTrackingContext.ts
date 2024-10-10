import { setProperties } from "./setProperties.js";
import type { RuntimeBrick, RuntimeContext } from "../interfaces.js";
import { getTplStateStore } from "../CustomTemplates/utils.js";
import { getFormStateStore } from "../FormRenderer/utils.js";

export interface TrackingContextItem {
  contextNames: string[] | Set<string> | false;
  stateNames: string[] | Set<string> | false;
  formStateNames: string[] | Set<string> | false;
  propName: string;
  propValue: unknown;
}

export interface InitialTracker {
  disposes: (() => void)[];
  listener: () => void;
}

export function listenOnTrackingContext(
  brick: RuntimeBrick,
  trackingContextList: TrackingContextItem[]
): void {
  for (const track of trackingContextList) {
    const listener = (): void => {
      if (brick.element) {
        setProperties(
          brick.element,
          { [track.propName]: track.propValue },
          brick.runtimeContext
        );
      }
    };
    brick.disposes ??= [];
    if (track.contextNames) {
      for (const contextName of track.contextNames) {
        brick.disposes.push(
          brick.runtimeContext.ctxStore.onChange(contextName, listener)
        );
      }
    }
    if (track.stateNames) {
      const tplStateStore = getTplStateStore(
        brick.runtimeContext,
        "STATE",
        `: "${track.propValue}"`
      );
      for (const stateName of track.stateNames) {
        brick.disposes.push(tplStateStore.onChange(stateName, listener));
      }
    }
    if (track.formStateNames) {
      const formStateStore = getFormStateStore(
        brick.runtimeContext,
        "FORM_STATE",
        `: "${track.propValue}"`
      );
      for (const stateName of track.formStateNames) {
        brick.disposes.push(formStateStore.onChange(stateName, listener));
      }
    }
  }
}

export function trackAfterInitial(
  runtimeContext: RuntimeContext,
  trackingContextList: Pick<
    TrackingContextItem,
    "contextNames" | "stateNames" | "propValue"
  >[],
  initialTracker: InitialTracker | undefined
) {
  if (!initialTracker) {
    return;
  }
  for (const { contextNames, stateNames, propValue } of trackingContextList) {
    if (contextNames) {
      for (const contextName of contextNames) {
        initialTracker.disposes.push(
          runtimeContext.ctxStore.onChange(contextName, initialTracker.listener)
        );
      }
    }
    if (stateNames) {
      for (const stateName of stateNames) {
        const tplStateStore = getTplStateStore(
          runtimeContext,
          "STATE",
          `: "${propValue}"`
        );
        initialTracker.disposes.push(
          tplStateStore.onChange(stateName, initialTracker.listener)
        );
      }
    }
  }
}
