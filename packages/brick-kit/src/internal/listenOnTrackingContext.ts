import {
  PluginRuntimeContext,
  StoryboardContextItemFreeVariable,
} from "@next-core/brick-types";
import { setProperties } from "./setProperties";
import { RuntimeBrick } from "../core/BrickNode";
import { getCustomTemplateContext } from "../core/CustomTemplates/CustomTemplateContext";
import { getCustomFormContext } from "../core/CustomForms/CustomFormContext";

export interface TrackingContextItem {
  contextNames: string[] | false;
  stateNames: string[] | false;
  formStateNames: string[] | false;
  propName: string;
  propValue: string;
}

export function listenOnTrackingContext(
  brick: RuntimeBrick,
  trackingContextList: TrackingContextItem[],
  context: PluginRuntimeContext
): void {
  for (const track of trackingContextList) {
    const listener = (): void => {
      if (brick.element) {
        setProperties(
          brick.element,
          { [track.propName]: track.propValue },
          context,
          true
        );
      }
    };
    if (track.contextNames) {
      for (const contextName of track.contextNames) {
        const ctx = context.storyboardContext.get(contextName);
        (
          ctx as StoryboardContextItemFreeVariable
        )?.eventTarget?.addEventListener("context.change", listener);
      }
    }
    if (track.stateNames) {
      const tplContext = getCustomTemplateContext(context.tplContextId);
      for (const stateName of track.stateNames) {
        const ctx = tplContext.state.get().get(stateName);
        (
          ctx as StoryboardContextItemFreeVariable
        )?.eventTarget?.addEventListener("state.change", listener);
      }
    }
    if (track.formStateNames) {
      const formContext = getCustomFormContext(context.formContextId);
      for (const stateName of track.formStateNames) {
        const ctx = formContext.formState.get().get(stateName);
        (
          ctx as StoryboardContextItemFreeVariable
        )?.eventTarget?.addEventListener("formstate.change", listener);
      }
    }
  }
}
