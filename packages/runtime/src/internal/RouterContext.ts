import type {
  BrickEventHandler,
  BrickLifeCycle,
  PluginHistoryState,
  RuntimeContext,
} from "@next-core/brick-types";
import type { Action, Location } from "history";
import { RuntimeBrick } from "./Renderer.js";
import { listenerFactory } from "./bindListeners.js";
import { getHistory } from "../history.js";
import { getReadOnlyProxy } from "./proxyFactories.js";
import type { Media } from "./mediaQuery.js";

type MemoizedLifeCycle<T> = {
  [Key in keyof T]: {
    brick: RuntimeBrick;
    handlers: T[Key];
  }[];
};

export class RouterContext {
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
        | "onScrollIntoView"
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
    onScrollIntoView: [],
  };
  private observers: IntersectionObserver[] = [];

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
      "onScrollIntoView",
    ] as const;
    for (const key of lifeCycleTypes) {
      const handlers = lifeCycle[key];
      if (handlers) {
        this.memoizedLifeCycle[key as "onPageLoad"].push({
          brick,
          handlers: handlers as BrickEventHandler | BrickEventHandler[],
        });
      }
    }
  }

  dispose(): void {
    for (const list of Object.values(this.memoizedLifeCycle)) {
      list.length = 0;
    }
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers.length = 0;
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
    for (const { brick, handlers } of this.memoizedLifeCycle[type] ?? []) {
      listenerFactory(handlers, runtimeContext, brick)(event);
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

  dispatchMediaChange(detail: Media, runtimeContext: RuntimeContext): void {
    this.dispatchGeneralLifeCycle(
      "onMediaChange",
      new CustomEvent("media.change", {
        detail: getReadOnlyProxy(detail),
      }),
      runtimeContext
    );
  }

  initializeScrollIntoView(runtimeContext: RuntimeContext): void {
    for (const { brick, handlers: conf } of this.memoizedLifeCycle
      .onScrollIntoView ?? []) {
      const threshold = conf.threshold ?? 0.1;
      const observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (entry.intersectionRatio >= threshold) {
                listenerFactory(
                  conf.handlers,
                  runtimeContext,
                  brick
                )(new CustomEvent("scroll.into.view"));
                observer.disconnect();
              }
            }
          });
        },
        {
          threshold,
        }
      );
      observer.observe(brick.element!);
      this.observers.push(observer);
    }
  }
}
