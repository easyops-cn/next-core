import { setProperties } from "./setProperties.js";
import type { RuntimeBrick } from "../interfaces.js";
import { getTplStateStore } from "../CustomTemplates/utils.js";

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
    if (track.contextNames) {
      for (const contextName of track.contextNames) {
        brick.runtimeContext.ctxStore.onChange(contextName, listener);
      }
    }
    if (track.stateNames) {
      const tplStateStore = getTplStateStore(
        brick.runtimeContext,
        "STATE",
        `: "${track.propValue}"`
      );
      for (const stateName of track.stateNames) {
        tplStateStore.onChange(stateName, listener);
      }
    }
    // if (track.formStateNames) {
    //   const formContext = getCustomFormContext(context.formContextId);
    //   for (const stateName of track.formStateNames) {
    //     const ctx = formContext.formState.get().get(stateName);
    //     (
    //       ctx as StoryboardContextItemFreeVariable
    //     )?.eventTarget?.addEventListener("formstate.change", listener);
    //   }
    // }
  }
}
