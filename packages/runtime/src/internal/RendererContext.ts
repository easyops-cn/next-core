import type {
  BrickEventHandler,
  BrickLifeCycle,
  PluginHistoryState,
  UseBrickLifeCycle,
  UseSingleBrickConf,
} from "@next-core/brick-types";
import type { Action, Location } from "history";
import { listenerFactory } from "./bindListeners.js";
import { getHistory } from "../history.js";
import { getReadOnlyProxy } from "./proxyFactories.js";
import { Media, mediaEventTarget } from "./mediaQuery.js";
import type { RuntimeBrick } from "./interfaces.js";

type MemoizedLifeCycle<T> = {
  [Key in keyof T]: {
    brick: RuntimeBrick;
    handlers: T[Key];
  }[];
};

export class RendererContext {
  public readonly type: "router" | "useBrick";

  constructor(type: "router" | "useBrick") {
    this.type = type;
  }

  #memoizedLifeCycle: MemoizedLifeCycle<
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
        // Omitted:
        // "onMessage"
        // "onMessageClose"
      > &
        UseBrickLifeCycle
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
    onMount: [],
    onUnmount: [],
  };
  #observers: IntersectionObserver[] = [];
  #mediaListener: EventListener | undefined;

  registerBrickLifeCycle(
    brick: RuntimeBrick,
    lifeCycle: BrickLifeCycle | UseSingleBrickConf["lifeCycle"] | undefined
  ): void {
    if (!lifeCycle) {
      return;
    }
    const lifeCycleTypes =
      this.type === "useBrick"
        ? ([
            "onMount",
            "onUnmount",
            "onMediaChange",
            "onScrollIntoView",
          ] as const)
        : ([
            "onBeforePageLoad",
            "onPageLoad",
            "onPageLeave",
            "onBeforePageLeave",
            "onAnchorLoad",
            "onAnchorUnload",
            "onMediaChange",
            "onScrollIntoView",
          ] as const);
    for (const key of lifeCycleTypes) {
      const handlers = (lifeCycle as BrickLifeCycle)[key as "onPageLoad"];
      if (handlers) {
        this.#memoizedLifeCycle[key as "onPageLoad"].push({
          brick,
          handlers: handlers as BrickEventHandler | BrickEventHandler[],
        });
      }
    }
  }

  dispose(): void {
    for (const list of Object.values(this.#memoizedLifeCycle)) {
      list.length = 0;
    }
    for (const observer of this.#observers) {
      observer.disconnect();
    }
    this.#observers.length = 0;
    if (this.#mediaListener) {
      mediaEventTarget.removeEventListener("change", this.#mediaListener);
      this.#mediaListener = undefined;
    }
  }

  #dispatchGeneralLifeCycle(
    type:
      | "onBeforePageLoad"
      | "onPageLoad"
      | "onPageLeave"
      | "onBeforePageLeave"
      | "onAnchorLoad"
      | "onAnchorUnload"
      | "onMediaChange"
      | "onMount"
      | "onUnmount",
    event: CustomEvent
  ): void {
    if (process.env.NODE_ENV === "development") {
      if (
        type === "onMount" || type === "onUnmount"
          ? this.type !== "useBrick"
          : this.type === "useBrick" && type !== "onMediaChange"
      ) {
        throw new Error(
          `\`lifeCycle.${type}\` cannot be used in ${this.type}.\nThis is a bug of Brick Next, please report it.`
        );
      }
    }
    for (const { brick, handlers } of this.#memoizedLifeCycle[type] ?? []) {
      listenerFactory(handlers, brick.runtimeContext, brick)(event);
    }
  }

  dispatchBeforePageLoad(): void {
    this.#dispatchGeneralLifeCycle(
      "onBeforePageLoad",
      new CustomEvent("page.beforeLoad")
    );
  }

  dispatchPageLoad(): void {
    const event = new CustomEvent("page.load");
    this.#dispatchGeneralLifeCycle("onPageLoad", event);
    // Currently only for e2e testing
    window.dispatchEvent(event);
  }

  dispatchBeforePageLeave(detail: {
    location?: Location<PluginHistoryState>;
    action?: Action;
  }): void {
    this.#dispatchGeneralLifeCycle(
      "onBeforePageLeave",
      new CustomEvent("page.beforeLeave", { detail })
    );
  }

  dispatchPageLeave(): void {
    this.#dispatchGeneralLifeCycle(
      "onPageLeave",
      new CustomEvent("page.leave")
    );
  }

  dispatchAnchorLoad(): void {
    const { hash } = getHistory().location;
    if (hash && hash !== "#") {
      this.#dispatchGeneralLifeCycle(
        "onAnchorLoad",
        new CustomEvent("anchor.load", {
          detail: {
            hash,
            anchor: hash.substring(1),
          },
        })
      );
    } else {
      this.#dispatchGeneralLifeCycle(
        "onAnchorUnload",
        new CustomEvent("anchor.unload")
      );
    }
  }

  initializeScrollIntoView(): void {
    for (const { brick, handlers: conf } of this.#memoizedLifeCycle
      .onScrollIntoView ?? []) {
      const threshold = conf.threshold ?? 0.1;
      const observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (entry.intersectionRatio >= threshold) {
                listenerFactory(
                  conf.handlers,
                  brick.runtimeContext,
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
      this.#observers.push(observer);
    }
  }

  initializeMediaChange(): void {
    this.#mediaListener = (event) => {
      this.#dispatchGeneralLifeCycle(
        "onMediaChange",
        new CustomEvent("media.change", {
          detail: getReadOnlyProxy((event as CustomEvent<Media>).detail),
        })
      );
    };
    mediaEventTarget.addEventListener("change", this.#mediaListener);
  }

  dispatchOnMount(): void {
    this.#dispatchGeneralLifeCycle("onMount", new CustomEvent("mount"));
  }

  dispatchOnUnmount(): void {
    this.#dispatchGeneralLifeCycle("onUnmount", new CustomEvent("unmount"));
  }
}
