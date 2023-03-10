import type {
  BrickEventHandler,
  BrickLifeCycle,
  ScrollIntoViewConf,
  UseBrickLifeCycle,
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
] as const;

const routerOnlyLifeCycles = [
  "onBeforePageLoad",
  "onPageLoad",
  "onPageLeave",
  "onBeforePageLeave",
  "onAnchorLoad",
  "onAnchorUnload",
] as const;

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
        | "onMount"
        | "onUnmount"
        // Omitted:
        // "onMessage"
        // "onMessageClose"
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
  };
  // #observers: IntersectionObserver[] = [];
  #observers = new Map<RenderBrick, IntersectionObserver[]>();
  #mediaListener: EventListener | undefined;

  #memoizedControlNodes?: WeakMap<
    RenderNode,
    Map<
      string,
      {
        node?: RenderBrick;
        last?: RenderBrick;
        lastPortal?: RenderBrick | undefined;
      }
    >
  >;

  registerBrickLifeCycle(
    brick: RenderBrick,
    lifeCycle: BrickLifeCycle | UseBrickLifeCycle | undefined
  ): void {
    if (!lifeCycle) {
      return;
    }
    const lifeCycleTypes = [
      ...commonLifeCycles,
      ...(this.type === "router" ? routerOnlyLifeCycles : []),
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
    if (!isEmpty((lifeCycle as { useResolves?: unknown }).useResolves)) {
      // eslint-disable-next-line no-console
      console.error(
        "`lifeCycle.useResolves` is not supported in v3:",
        lifeCycle
      );
    }
  }

  #unmountBricks(bricks: Set<RenderBrick>): void {
    const lifeCycleTypes = [
      ...commonLifeCycles,
      ...(this.type === "router" ? routerOnlyLifeCycles : []),
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
    for (const { brick, handlers } of this.#memoizedLifeCycle.onMount ?? []) {
      if (bricks.has(brick)) {
        listenerFactory(handlers, brick.runtimeContext, brick)(mountEvent);
      }
    }

    for (const { brick, handlers: conf } of this.#memoizedLifeCycle
      .onScrollIntoView ?? []) {
      if (bricks.has(brick)) {
        this.#addObserver(brick, conf);
      }
    }
  }

  memoizeControlNode(
    slotId: string | undefined,
    key: number,
    node: RenderBrick | undefined,
    returnNode: RenderNode
  ) {
    if (!this.#memoizedControlNodes) {
      this.#memoizedControlNodes = new WeakMap();
    }
    const memKey = `${slotId ?? ""}.${key}`;
    let mem = this.#memoizedControlNodes.get(returnNode);
    if (!mem) {
      mem = new Map();
      this.#memoizedControlNodes.set(returnNode, mem);
    }

    mem.set(memKey, {
      node,
      last: getLastNode(node),
      lastPortal: getLastPortalNode(node),
    });
  }

  rerenderControlNode(
    slotId: string | undefined,
    key: number,
    node: RenderBrick | undefined,
    returnNode: RenderNode
  ) {
    const memKey = `${slotId ?? ""}.${key}`;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const memoized = this.#memoizedControlNodes!.get(returnNode)!.get(memKey)!;
    const {
      node: prevNode,
      last: prevLast,
      lastPortal: prevLastPortal,
    } = memoized;
    const insertPortalBeforeChild =
      prevLastPortal?.element?.nextSibling ?? null;

    const last = getLastNode(node);
    memoized.node = node;
    memoized.last = last;

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
    const insertBeforeChild = prevLast?.sibling?.element ?? null;

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
  }

  // Note: no `onScrollIntoView`
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
    if (
      process.env.NODE_ENV === "development" &&
      this.type === "useBrick" &&
      routerOnlyLifeCycles.includes(type as "onPageLoad")
    ) {
      throw new Error(
        `\`lifeCycle.${type}\` cannot be used in ${this.type}.\nThis is a bug of Brick Next, please report it.`
      );
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
      .onScrollIntoView ?? []) {
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
      current = current.return.sibling;
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
      if (current.return === to) {
        break;
      }
      current = current.return.sibling;
    }
  }
  return range;
}
