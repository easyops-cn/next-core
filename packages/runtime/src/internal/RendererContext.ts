import type {
  BrickEventHandler,
  BrickLifeCycle,
  MessageConf,
  RouteConf,
  ScrollIntoViewConf,
  SlotConfOfRoutes,
  StaticMenuConf,
} from "@next-core/types";
import type { Action, Location } from "history";
import { isEmpty, remove } from "lodash";
import { listenerFactory } from "./bindListeners.js";
import { NextHistoryState, NextLocation, getHistory } from "../history.js";
import { getReadOnlyProxy } from "./proxyFactories.js";
import { Media, mediaEventTarget } from "./mediaQuery.js";
import type {
  MenuRequestNode,
  RenderBrick,
  RenderChildNode,
  RenderNode,
  RenderReturnNode,
  RenderRoot,
} from "./interfaces.js";
import { mountTree } from "./mount.js";
import { RenderTag } from "./enums.js";
import { unbindTemplateProxy } from "./CustomTemplates/bindTemplateProxy.js";
import { hooks } from "./Runtime.js";
import type { RenderOutput } from "./Renderer.js";

type MemoizedLifeCycle<T> = {
  [Key in keyof T]: {
    brick: RenderBrick;
    handlers: T[Key];
  }[];
};

type LocationChangeCallback = (
  location: Location<NextHistoryState>,
  prevLocation: Location<NextHistoryState>,
  noIncremental: false | "parent" | undefined
) => Promise<boolean>;

interface IncrementalRenderState {
  parentRoutes: RouteConf[];
  callback: LocationChangeCallback;
}

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
  routeHelper?: RouteHelper;
  renderId?: string;
}

export interface RouteHelper {
  bailout: (output: RenderOutput) => true | undefined;
  mergeMenus: (menuRequests: Promise<StaticMenuConf>[]) => Promise<void>;
  /**
   * Will always resolve when the routing is not the current bootstrap.
   * Otherwise, will throw an error when not bailout.
   *
   * @returns undefined when bailout, or failed output otherwise
   */
  catch: (
    error: unknown,
    returnNode: RenderReturnNode,
    isCurrentBootstrap?: boolean,
    isReCatch?: boolean
  ) => Promise<
    | undefined
    | {
        failed: true;
        output: RenderOutput;
      }
  >;
}

export class RendererContext {
  /**
   * - page: render as whole page, triggering page life cycles.
   * - fragment: render as fragment, not triggering page life cycles.
   */
  public readonly scope: "page" | "fragment";

  public readonly unknownBricks: "silent" | "throw";

  public readonly renderId: string | undefined;

  #routeHelper: RouteHelper | undefined;

  constructor(scope: "page" | "fragment", options?: RendererContextOptions) {
    this.scope = scope;
    this.unknownBricks = options?.unknownBricks ?? "throw";
    this.#routeHelper = options?.routeHelper;
    this.renderId = options?.renderId;
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

  #memoized?: WeakMap<
    RenderNode,
    Map<
      string,
      {
        node?: RenderChildNode;
        last?: RenderChildNode;
        lastNormal?: RenderBrick | undefined;
        lastPortal?: RenderBrick | undefined;
      }
    >
  >;

  #initialMenuRequestNode?: MenuRequestNode;
  #memoizedMenuRequestNodeMap?: WeakMap<
    RouteConf[],
    MenuRequestNode | undefined
  > = new WeakMap<RouteConf[], MenuRequestNode | undefined>();

  setInitialMenuRequestNode(menuRequestNode: MenuRequestNode) {
    this.#initialMenuRequestNode = menuRequestNode;
  }

  memoizeMenuRequestNode(
    routes: RouteConf[],
    menuRequestNode: MenuRequestNode
  ) {
    this.#memoizedMenuRequestNodeMap!.set(routes, menuRequestNode);
  }

  getMenuRequests() {
    const menuRequests: Promise<StaticMenuConf>[] = [];
    let current = this.#initialMenuRequestNode;
    while (current) {
      if (current.request) {
        menuRequests.push(current.request);
      }
      if (current.child) {
        current = current.child;
      } else {
        while (current && !current.sibling) {
          current = current.return;
        }
        current = current?.sibling;
      }
    }
    return menuRequests;
  }

  async reMergeMenuRequestNodes(
    parentMenuRequestNode: MenuRequestNode,
    routes: RouteConf[],
    menuRequestNode: MenuRequestNode = {}
  ) {
    const node = this.#memoizedMenuRequestNodeMap!.get(routes);
    this.#memoizedMenuRequestNodeMap!.set(routes, menuRequestNode);

    let current = parentMenuRequestNode.child;
    let previousSibling: MenuRequestNode | undefined;

    while (current) {
      if (current === node) {
        break;
      }
      previousSibling = current;
      current = current.sibling;
    }

    if (previousSibling) {
      previousSibling.sibling = menuRequestNode;
      menuRequestNode.sibling = node?.sibling;
    } else {
      parentMenuRequestNode.child = menuRequestNode;
    }

    await this.#routeHelper!.mergeMenus(this.getMenuRequests());
  }

  reBailout(output: RenderOutput) {
    return this.#routeHelper!.bailout(output);
  }

  /**
   * Will always resolve when the routing is not the current bootstrap.
   * Otherwise, will throw an error when not bailout.
   *
   * @returns undefined when bailout, or failed output otherwise
   */
  reCatch(error: unknown, returnNode: RenderReturnNode) {
    return this.#routeHelper!.catch(error, returnNode, false, true);
  }

  #incrementalRenderStates = new Map<
    SlotConfOfRoutes,
    IncrementalRenderState
  >();

  async didPerformIncrementalRender(
    location: Location<NextHistoryState>,
    prevLocation: Location<NextHistoryState>,
    noIncremental: false | "parent" | undefined
  ) {
    let finalResult = false;
    const shouldIgnoreRoutes: RouteConf[] = [];
    // Perform incremental rendering from inside out.
    // This allows nested incremental sub-routes.
    for (const { parentRoutes, callback } of [
      ...this.#incrementalRenderStates.values(),
    ].reverse()) {
      const parentRoute = parentRoutes[parentRoutes.length - 1];
      if (shouldIgnoreRoutes.includes(parentRoute)) {
        // Do not re-render parent routes if any of its children has performed incremental rendering.
        // In the meantime, allow sibling-routes to perform incremental rendering.
        continue;
      }
      const result = await callback(location, prevLocation, noIncremental);
      // When result is true, it means the incremental rendering is performed.
      if (result) {
        shouldIgnoreRoutes.push(...parentRoutes.slice(0, -1));
      }
      // Mark incremental rendering as performed at final if result is true or null.
      if (result !== false) {
        finalResult = true;
      }
    }
    return finalResult;
  }

  /**
   * When `callback` resolved to `true` which means incremental rendering is performed,
   * ignore normal rendering.
   */
  performIncrementalRender(
    slotConf: SlotConfOfRoutes,
    parentRoutes: RouteConf[],
    callback: LocationChangeCallback
  ) {
    // Override stale incremental render callbacks
    this.#incrementalRenderStates.set(slotConf, { parentRoutes, callback });
  }

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
      // Dispose context listeners
      brick.disposes?.forEach((dispose) => dispose());
      delete brick.disposes;
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

  memoize(
    slotId: string | undefined,
    keyPath: number[],
    node: RenderChildNode | undefined,
    returnNode: RenderReturnNode
  ) {
    if (!this.#memoized) {
      this.#memoized = new WeakMap();
    }
    const memKey = [slotId ?? "", ...keyPath].join(".");
    let mem = this.#memoized.get(returnNode);
    if (!mem) {
      mem = new Map();
      this.#memoized.set(returnNode, mem);
    }

    mem.set(memKey, {
      node,
      last: getLastNode(node),
      lastNormal: getLastNormalNode(node),
      lastPortal: getLastPortalNode(node),
    });
  }

  reRender(
    slotId: string | undefined,
    keyPath: number[],
    node: RenderChildNode | undefined,
    returnNode: RenderReturnNode
  ) {
    const memKey = [slotId ?? "", ...keyPath].join(".");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const memoized = this.#memoized!.get(returnNode)!.get(memKey)!;
    const {
      node: prevNode,
      last: prevLast,
      lastNormal: prevLastNormal,
      lastPortal: prevLastPortal,
    } = memoized;

    let insertBeforeChild: ChildNode | null;
    const insertPortalBeforeChildCandidates: ChildNode[] = [];
    if (prevNode?.tag === RenderTag.PLACEHOLDER) {
      insertBeforeChild = getNextNormalNode(prevNode)?.element ?? null;
      // Todo(steve): handle portal bricks from useBrick.
      const nextSibling = getNextPortalNode(prevNode)?.element;
      if (nextSibling) {
        insertPortalBeforeChildCandidates.push(nextSibling);
      }
    } else {
      insertBeforeChild = prevLastNormal?.element?.nextSibling ?? null;
      let nextSibling = prevLastPortal?.element?.nextSibling;
      while (nextSibling) {
        insertPortalBeforeChildCandidates.push(nextSibling);
        // Collect all portal bricks from useBrick, until found a normal portal
        // brick other than from useBrick.
        // Because useBrick could be removed during unmount.
        if (
          !(nextSibling instanceof HTMLElement && nextSibling.tagName === "DIV")
        ) {
          break;
        }
        nextSibling = nextSibling.nextSibling;
      }
    }

    const last = getLastNode(node);
    memoized.node = node;
    memoized.last = last;
    memoized.lastNormal = getLastNormalNode(node);
    memoized.lastPortal = getLastPortalNode(node);

    // Figure out the unchanged prev sibling and next sibling
    let prevSibling: RenderChildNode | undefined;
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

    if (fragment.hasChildNodes()) {
      if (returnNode.tag === RenderTag.ROOT) {
        returnNode.container?.insertBefore(fragment, insertBeforeChild);
      } else {
        returnNode.element?.insertBefore(fragment, insertBeforeChild);
      }
    }

    if (portalFragment.hasChildNodes()) {
      let root: RenderNode | undefined = node;
      while (root && root.return) {
        root = root.return;
      }
      // istanbul ignore next
      if (root?.tag !== RenderTag.ROOT) {
        throw new Error(
          "Cannot find render root node. This is a bug of Brick Next, please report it."
        );
      }
      const portal =
        typeof root.createPortal === "function"
          ? root.createPortal()
          : root.createPortal;
      let insertPortalBeforeChild: ChildNode | null = null;
      for (const candidate of insertPortalBeforeChildCandidates) {
        // Those candidates from useBrick could be removed during unmount.
        // So we need to check if they are still in the portal.
        if (portal.contains(candidate)) {
          insertPortalBeforeChild = candidate;
          break;
        }
      }
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
    this.#memoized = undefined;
    this.#arbitraryLifeCycle.clear();
    this.#incrementalRenderStates.clear();
    this.#memoizedMenuRequestNodeMap = undefined;
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

function getLastNode(
  node: RenderChildNode | undefined
): RenderChildNode | undefined {
  let last = node;
  while (last?.sibling) {
    last = last.sibling;
  }
  return last;
}

function getLastNormalNode(
  node: RenderChildNode | undefined
): RenderBrick | undefined {
  return getSpecifiedNormalNode(node, false);
}

function getNextNormalNode(
  node: RenderChildNode | undefined
): RenderBrick | undefined {
  return getSpecifiedNormalNode(node, true);
}

function getSpecifiedNormalNode(
  node: RenderChildNode | undefined,
  next: boolean
): RenderBrick | undefined {
  let last: RenderBrick | undefined;
  let current = node;
  while (current) {
    if (current.tag === RenderTag.BRICK && !current.portal) {
      if (next) {
        return current;
      }
      last = current;
    }
    current = current.sibling;
  }
  return last;
}

function getLastPortalNode(
  node: RenderChildNode | undefined
): RenderBrick | undefined {
  return getSpecifiedPortalNode(node, false);
}

function getNextPortalNode(
  node: RenderChildNode | undefined
): RenderBrick | undefined {
  return getSpecifiedPortalNode(node, true);
}

function getSpecifiedPortalNode(
  node: RenderChildNode | undefined,
  next: boolean
): RenderBrick | undefined {
  let last: RenderBrick | undefined;
  let current = node;
  while (current) {
    if (current.tag === RenderTag.BRICK && current.portal) {
      if (next) {
        return current;
      }
      last = current;
    }
    if (current.child) {
      current = current.child;
    } else if (current.sibling) {
      current = current.sibling;
    } else {
      let currentReturn: RenderReturnNode | null | undefined = current.return;
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
  from: RenderChildNode | undefined,
  to: RenderChildNode | undefined
): Set<RenderBrick> {
  const range = new Set<RenderBrick>();
  let current = from;
  while (current) {
    if (current.tag === RenderTag.BRICK) {
      range.add(current);
    }
    if (current.child) {
      current = current.child;
    } else if (current === to) {
      break;
    } else if (current.sibling) {
      current = current.sibling;
    } else {
      let currentReturn: RenderReturnNode | null | undefined = current.return;
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
