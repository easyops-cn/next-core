import type {
  BrickEventHandler,
  BrickLifeCycle,
  MessageConf,
  ScrollIntoViewConf,
} from "@next-core/types";
import type { Action } from "history";
import { isEmpty, remove } from "lodash";
import { listenerFactory } from "./bindListeners.js";
import { NextLocation, getHistory } from "../history.js";
import { getReadOnlyProxy } from "./proxyFactories.js";
import { Media, mediaEventTarget } from "./mediaQuery.js";
import type { RenderBrick, RenderNode, RenderRoot } from "./interfaces.js";
import { mountTree } from "./mount.js";
import { RenderTag } from "./enums.js";
import { unbindTemplateProxy } from "./CustomTemplates/bindTemplateProxy.js";
import { hooks } from "./Runtime.js";

type MemoizedLifeCycle<T> = {
  [Key in keyof T]: {
    brick: RenderBrick;
    handlers: T[Key];
  }[];
};

const commonLifeCycles = [
  "onMount",
  "onUnmount",
  "onMediaChange",
  "onScrollIntoView",
  "onMessage",
  "onMessageClose",
] as const;

const pageOnlyLifeCycles = [
  "onBeforePageLoad",
  "onPageLoad",
  "onPageLeave",
  "onBeforePageLeave",
  "onAnchorLoad",
  "onAnchorUnload",
] as const;

export interface RendererContextOptions {
  unknownBricks?: "silent" | "throw";
}

export class RendererContext {
  /**
   * - page: render as whole page, triggering page life cycles.
   * - fragment: render as fragment, not triggering page life cycles.
   */
  public readonly scope: "page" | "fragment";

  public readonly unknownBricks: "silent" | "throw";

  constructor(scope: "page" | "fragment", options?: RendererContextOptions) {
    this.scope = scope;
    this.unknownBricks = options?.unknownBricks ?? "throw";
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
        | "onMount"
        | "onUnmount"
        | "onMessage"
        | "onMessageClose"
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
    onMount: [],
    onUnmount: [],
    onMessage: [],
    onMessageClose: [],
  };
  #observers = new Map<RenderBrick, IntersectionObserver[]>();
  #mediaListener: EventListener | undefined;

  #arbitraryLifeCycle = new Map<string, Set<() => void>>();

  #memoizedControlNodes?: WeakMap<
    RenderNode,
    Map<
      string,
      {
        node?: RenderBrick;
        last?: RenderBrick;
        lastNormal?: RenderBrick | undefined;
        lastPortal?: RenderBrick | undefined;
      }
    >
  >;

  registerBrickLifeCycle(
    brick: RenderBrick,
    lifeCycle: BrickLifeCycle | undefined
  ): void {
    if (!lifeCycle) {
      return;
    }
    const lifeCycleTypes = [
      ...commonLifeCycles,
      ...(this.scope === "page" ? pageOnlyLifeCycles : []),
    ];
    for (const key of lifeCycleTypes) {
      const handlers = (lifeCycle as BrickLifeCycle)[key as "onPageLoad"];
      if (handlers) {
        this.#memoizedLifeCycle[key as "onPageLoad"].push({
          brick,
          handlers: handlers as BrickEventHandler | BrickEventHandler[],
        });
      }
    }
    // istanbul ignore next
    if (!isEmpty((lifeCycle as { useResolves?: unknown }).useResolves)) {
      // eslint-disable-next-line no-console
      console.error("`lifeCycle.useResolves` is dropped in v3:", lifeCycle);
    }
  }

  registerArbitraryLifeCycle(lifeCycle: string, fn: () => void): void {
    const arbitraryCallbacks = this.#arbitraryLifeCycle.get(lifeCycle);
    if (arbitraryCallbacks) {
      arbitraryCallbacks.add(fn);
    } else {
      this.#arbitraryLifeCycle.set(lifeCycle, new Set([fn]));
    }
  }

  #unmountBricks(bricks: Set<RenderBrick>): void {
    const lifeCycleTypes = [
      ...commonLifeCycles,
      ...(this.scope === "page" ? pageOnlyLifeCycles : []),
    ];
    const unmountList: {
      brick: RenderBrick;
      handlers: BrickEventHandler | BrickEventHandler[];
    }[] = [];

    // Clear life cycle handlers, record `onUnmount` at the same time
    for (const key of lifeCycleTypes) {
      const removed = remove(
        this.#memoizedLifeCycle[key as "onPageLoad"],
        (item) => bricks.has(item.brick)
      );
      if (key === "onUnmount") {
        unmountList.push(...removed);
      }
    }

    // Clear intersection observers
    for (const brick of bricks) {
      const observers = this.#observers.get(brick);
      if (observers?.length) {
        for (const observer of observers) {
          observer.disconnect();
        }
        observers.length = 0;
        this.#observers.delete(brick);
      }

      unbindTemplateProxy(brick);
      delete brick.element?.$$tplStateStore;

      // Also remove the element
      brick.element?.remove();
    }

    // Dispatch unmount events
    const unmountEvent = new CustomEvent("unmount");
    for (const { brick, handlers } of unmountList) {
      listenerFactory(handlers, brick.runtimeContext, brick)(unmountEvent);
    }
  }

  #initializeRerenderBricks(bricks: Set<RenderBrick>): void {
    const mountEvent = new CustomEvent("mount");
    for (const { brick, handlers } of this.#memoizedLifeCycle.onMount) {
      if (bricks.has(brick)) {
        listenerFactory(handlers, brick.runtimeContext, brick)(mountEvent);
      }
    }

    for (const { brick, handlers: conf } of this.#memoizedLifeCycle
      .onScrollIntoView) {
      if (bricks.has(brick)) {
        this.#addObserver(brick, conf);
      }
    }
  }

  memoizeControlNode(
    slotId: string | undefined,
    keyPath: number[],
    node: RenderBrick | undefined,
    returnNode: RenderNode
  ) {
    if (!this.#memoizedControlNodes) {
      this.#memoizedControlNodes = new WeakMap();
    }
    const memKey = [slotId ?? "", ...keyPath].join(".");
    let mem = this.#memoizedControlNodes.get(returnNode);
    if (!mem) {
      mem = new Map();
      this.#memoizedControlNodes.set(returnNode, mem);
    }

    mem.set(memKey, {
      node,
      last: getLastNode(node),
      lastNormal: getLastNormalNode(node),
      lastPortal: getLastPortalNode(node),
    });
  }

  rerenderControlNode(
    slotId: string | undefined,
    keyPath: number[],
    node: RenderBrick | undefined,
    returnNode: RenderNode
  ) {
    const memKey = [slotId ?? "", ...keyPath].join(".");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const memoized = this.#memoizedControlNodes!.get(returnNode)!.get(memKey)!;
    const {
      node: prevNode,
      last: prevLast,
      lastNormal: prevLastNormal,
      lastPortal: prevLastPortal,
    } = memoized;

    const insertBeforeChild = prevLastNormal?.element?.nextSibling ?? null;
    const insertPortalBeforeChild =
      prevLastPortal?.element?.nextSibling ?? null;

    const last = getLastNode(node);
    memoized.node = node;
    memoized.last = last;
    memoized.lastNormal = getLastNormalNode(node);
    memoized.lastPortal = getLastPortalNode(node);

    // Figure out the unchanged prev sibling and next sibling
    let prevSibling: RenderBrick | undefined;
    let current = returnNode.child;
    while (current && current !== prevLast) {
      if (current.sibling === prevNode) {
        prevSibling = current;
        break;
      }
      current = current.sibling;
    }

    const fragment = document.createDocumentFragment();
    const portalFragment = document.createDocumentFragment();
    const renderRoot: RenderRoot = {
      tag: RenderTag.ROOT,
      container: fragment,
      createPortal: portalFragment,
      child: node,
    };

    // Override `return`
    current = node;
    while (current) {
      current.return = renderRoot;
      current = current.sibling;
    }

    // Unmount previous bricks, including their descendants
    const removeBricks = getBrickRange(prevNode, prevLast);
    this.#unmountBricks(removeBricks);

    mountTree(renderRoot);

    // Connect back
    if (prevSibling) {
      prevSibling.sibling = node;
    } else {
      returnNode.child = node;
    }
    if (last) {
      last.sibling = prevLast?.sibling;
    }

    // Resume `return`
    current = node;
    while (current) {
      current.return = returnNode;
      current = current.sibling;
    }

    if (returnNode.tag === RenderTag.ROOT) {
      returnNode.container?.insertBefore(fragment, insertBeforeChild);
    } else {
      returnNode.element?.insertBefore(fragment, insertBeforeChild);
    }

    if (portalFragment.childNodes.length > 0) {
      let root: RenderNode | undefined = node;
      while (root && root.return) {
        root = root.return;
      }
      if (root?.tag !== RenderTag.ROOT) {
        throw new Error("Cannot find render root node");
      }
      const portal =
        typeof root.createPortal === "function"
          ? root.createPortal()
          : root.createPortal;
      portal.insertBefore(portalFragment, insertPortalBeforeChild);
    }

    const newBricks = getBrickRange(node, last);
    this.#initializeRerenderBricks(newBricks);
  }

  dispose(): void {
    for (const list of Object.values(this.#memoizedLifeCycle)) {
      list.length = 0;
    }
    for (const list of this.#observers.values()) {
      for (const observer of list) {
        observer.disconnect();
      }
      list.length = 0;
    }
    this.#observers.clear();
    if (this.#mediaListener) {
      mediaEventTarget.removeEventListener("change", this.#mediaListener);
      this.#mediaListener = undefined;
    }
    this.#memoizedControlNodes = undefined;
    this.#arbitraryLifeCycle.clear();
  }

  // Note: no `onScrollIntoView` and `onMessage`
  #dispatchGeneralLifeCycle(
    type:
      | "onBeforePageLoad"
      | "onPageLoad"
      | "onPageLeave"
      | "onBeforePageLeave"
      | "onAnchorLoad"
      | "onAnchorUnload"
      | "onMediaChange"
      | "onMessageClose"
      | "onMount"
      | "onUnmount",
    event: Event
  ): void {
    // istanbul ignore next
    if (
      process.env.NODE_ENV === "development" &&
      this.scope === "fragment" &&
      pageOnlyLifeCycles.includes(type as "onPageLoad")
    ) {
      throw new Error(
        `\`lifeCycle.${type}\` cannot be used in ${this.scope}.\nThis is a bug of Brick Next, please report it.`
      );
    }
    for (const { brick, handlers } of this.#memoizedLifeCycle[type]) {
      listenerFactory(handlers, brick.runtimeContext, brick)(event);
    }
    const arbitraryCallbacks = this.#arbitraryLifeCycle.get(type);
    if (arbitraryCallbacks) {
      for (const fn of arbitraryCallbacks) {
        fn();
      }
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
    location?: NextLocation;
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
      .onScrollIntoView) {
      this.#addObserver(brick, conf);
    }
  }

  #addObserver(brick: RenderBrick, conf: ScrollIntoViewConf) {
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
    let list = this.#observers.get(brick);
    if (!list) {
      list = [];
      this.#observers.set(brick, list);
    }
    list.push(observer);
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

  initializeMessageDispatcher(): void {
    for (const { brick, handlers: confList } of this.#memoizedLifeCycle
      .onMessage) {
      for (const conf of ([] as MessageConf[]).concat(confList)) {
        hooks?.messageDispatcher?.onMessage(conf.channel, (detail) => {
          listenerFactory(
            conf.handlers,
            brick.runtimeContext,
            brick
          )(new CustomEvent("message.push", { detail }));
        });
      }
    }

    hooks?.messageDispatcher?.onClose(() => {
      this.#dispatchGeneralLifeCycle(
        "onMessageClose",
        new CustomEvent("message.close")
      );
    });
  }

  dispatchOnMount(): void {
    this.#dispatchGeneralLifeCycle("onMount", new CustomEvent("mount"));
  }

  dispatchOnUnmount(): void {
    this.#dispatchGeneralLifeCycle("onUnmount", new CustomEvent("unmount"));
  }
}

function getLastNode(node: RenderBrick | undefined): RenderBrick | undefined {
  let last = node;
  while (last?.sibling) {
    last = last.sibling;
  }
  return last;
}

function getLastNormalNode(
  node: RenderBrick | undefined
): RenderBrick | undefined {
  let last: RenderBrick | undefined;
  let current = node;
  while (current) {
    if (!current.portal) {
      last = current;
    }
    current = current.sibling;
  }
  return last;
}

function getLastPortalNode(
  node: RenderBrick | undefined
): RenderBrick | undefined {
  let last: RenderBrick | undefined;
  let current = node;
  while (current) {
    if (current.portal) {
      last = current;
    }
    if (current.child) {
      current = current.child;
    } else if (current.sibling) {
      current = current.sibling;
    } else {
      let currentReturn: RenderNode | null | undefined = current.return;
      while (currentReturn) {
        if (currentReturn.sibling) {
          break;
        }
        currentReturn = currentReturn.return;
      }
      current = currentReturn?.sibling;
    }
  }
  return last;
}

function getBrickRange(
  from: RenderBrick | undefined,
  to: RenderBrick | undefined
): Set<RenderBrick> {
  const range = new Set<RenderBrick>();
  let current = from;
  while (current) {
    range.add(current);
    if (current.child) {
      current = current.child;
    } else if (current === to) {
      break;
    } else if (current.sibling) {
      current = current.sibling;
    } else {
      let currentReturn: RenderNode | null | undefined = current.return;
      while (currentReturn && currentReturn !== to) {
        if (currentReturn.sibling) {
          break;
        }
        currentReturn = currentReturn.return;
      }
      if (currentReturn === to) {
        break;
      }
      current = currentReturn?.sibling;
    }
  }
  return range;
}
