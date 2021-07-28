import {
  PluginRuntimeContext,
  StoryboardContextItemFreeVariable,
} from "@next-core/brick-types";
import { setProperties, TrackingContextItem } from "../setProperties";
import { RuntimeBrick } from "./BrickNode";

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
    for (const contextName of track.contextNames) {
      const ctx = context.storyboardContext.get(contextName);
      (ctx as StoryboardContextItemFreeVariable)?.eventTarget?.addEventListener(
        "context.change",
        listener
      );
    }
  }
}
