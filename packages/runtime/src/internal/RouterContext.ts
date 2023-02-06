import type {
  BrickEventHandler,
  BrickLifeCycle,
  PluginHistoryState,
  RuntimeContext,
} from "@next-core/brick-types";
import type { Action, Location } from "history";
import { RuntimeBrick } from "./Transpiler.js";
import { listenerFactory } from "./bindListeners.js";
import { getHistory } from "../history.js";

interface BrickAndLifeCycleHandler {
  brick: RuntimeBrick;
  handler: BrickEventHandler | BrickEventHandler[] | undefined;
}

type MemoizedLifeCycle<T> = {
  [Key in keyof T]: {
    brick: RuntimeBrick;
    handlers: T[Key];
  }[];
};

export class RouterContext {
  private pageLoadHandlers: BrickAndLifeCycleHandler[] = [];
  private memoizedLifeCycle: MemoizedLifeCycle<
    Required<
      Pick<
        BrickLifeCycle,
        | "onBeforePageLoad"
        | "onPageLoad"
        | "onPageLeave"
        | "onBeforePageLeave"
        | "onAnchorLoad"
        | "onAnchorUnload"
        | "onMediaChange"
      >
    >
  > = {
    onBeforePageLoad: [],
    onPageLoad: [],
    onPageLeave: [],
    onBeforePageLeave: [],
    onAnchorLoad: [],
    onAnchorUnload: [],
    onMediaChange: [],
  };

  registerBrickLifeCycle(
    brick: RuntimeBrick,
    lifeCycle: BrickLifeCycle | undefined
  ): void {
    if (!lifeCycle) {
      return;
    }
    const lifeCycleTypes = [
      "onBeforePageLoad",
      "onPageLoad",
      "onPageLeave",
      "onBeforePageLeave",
      "onAnchorLoad",
      "onAnchorUnload",
      "onMediaChange",
    ] as const;
    for (const key of lifeCycleTypes) {
      const handlers = lifeCycle[key];
      if (handlers) {
        this.memoizedLifeCycle[key].push({
          brick,
          handlers,
        });
      }
    }
  }

  private dispatchGeneralLifeCycle(
    type:
      | "onBeforePageLoad"
      | "onPageLoad"
      | "onPageLeave"
      | "onBeforePageLeave"
      | "onAnchorLoad"
      | "onAnchorUnload"
      | "onMediaChange",
    event: CustomEvent,
    runtimeContext: RuntimeContext
  ): void {
    for (const item of this.memoizedLifeCycle[type] ?? []) {
      listenerFactory(item.handlers, runtimeContext, item.brick)(event);
    }
  }

  dispatchBeforePageLoad(runtimeContext: RuntimeContext): void {
    this.dispatchGeneralLifeCycle(
      "onBeforePageLoad",
      new CustomEvent("page.beforeLoad"),
      runtimeContext
    );
  }

  dispatchPageLoad(runtimeContext: RuntimeContext): void {
    const event = new CustomEvent("page.load");
    this.dispatchGeneralLifeCycle("onPageLoad", event, runtimeContext);
    // Currently only for e2e testing
    window.dispatchEvent(event);
  }

  dispatchBeforePageLeave(
    detail: {
      location?: Location<PluginHistoryState>;
      action?: Action;
    },
    runtimeContext: RuntimeContext
  ): void {
    this.dispatchGeneralLifeCycle(
      "onBeforePageLeave",
      new CustomEvent("page.beforeLeave", { detail }),
      runtimeContext
    );
  }

  dispatchPageLeave(runtimeContext: RuntimeContext): void {
    this.dispatchGeneralLifeCycle(
      "onPageLeave",
      new CustomEvent("page.leave"),
      runtimeContext
    );
  }

  dispatchAnchorLoad(runtimeContext: RuntimeContext): void {
    const { hash } = getHistory().location;
    if (hash && hash !== "#") {
      this.dispatchGeneralLifeCycle(
        "onAnchorLoad",
        new CustomEvent("anchor.load", {
          detail: {
            hash,
            anchor: hash.substring(1),
          },
        }),
        runtimeContext
      );
    } else {
      this.dispatchGeneralLifeCycle(
        "onAnchorUnload",
        new CustomEvent("anchor.unload"),
        runtimeContext
      );
    }
  }

  dispatchMediaChange(detail: unknown, runtimeContext: RuntimeContext): void {
    this.dispatchGeneralLifeCycle(
      "onMediaChange",
      new CustomEvent("media.change", {
        detail,
      }),
      runtimeContext
    );
  }
}
