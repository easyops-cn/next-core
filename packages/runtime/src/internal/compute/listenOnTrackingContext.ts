import type { RuntimeContext } from "@next-core/brick-types";
import { RuntimeBrick } from "../Transpiler.js";
import { setProperties } from "./setProperties.js";
// import { setProperties } from "./setProperties";
// import { RuntimeBrick } from "../core/BrickNode";
// import { getCustomTemplateContext } from "../core/CustomTemplates/CustomTemplateContext";
// import { getCustomFormContext } from "../core/CustomForms/CustomFormContext";

export interface TrackingContextItem {
  contextNames: Iterable<string> | false;
  stateNames: Iterable<string> | false;
  formStateNames: Iterable<string> | false;
  propName: string;
  propValue: unknown;
}

export function listenOnTrackingContext(
  brick: RuntimeBrick,
  trackingContextList: TrackingContextItem[],
  runtimeContext: RuntimeContext
): void {
  for (const track of trackingContextList) {
    const listener = (): void => {
      if (brick.element) {
        setProperties(
          brick.element,
          { [track.propName]: track.propValue },
          runtimeContext
        );
      }
    };
    if (track.contextNames) {
      for (const contextName of track.contextNames) {
        runtimeContext.ctxStore.onChange(contextName, listener);
      }
    }
    // if (track.stateNames) {
    //   const tplContext = getCustomTemplateContext(context.tplContextId);
    //   for (const stateName of track.stateNames) {
    //     const ctx = tplContext.state.get().get(stateName);
    //     (
    //       ctx as StoryboardContextItemFreeVariable
    //     )?.eventTarget?.addEventListener("state.change", listener);
    //   }
    // }
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
