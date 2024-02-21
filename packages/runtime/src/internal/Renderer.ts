import type {
  BrickConf,
  BrickConfInTemplate,
  ContextConf,
  MenuConf,
  RouteConf,
  RouteConfOfBricks,
  SlotConfOfBricks,
  SlotsConf,
  StaticMenuConf,
} from "@next-core/types";
import {
  enqueueStableLoadBricks,
  flushStableLoadBricks,
  loadBricksImperatively,
  loadProcessorsImperatively,
  loadScript,
  loadStyle,
} from "@next-core/loader";
import { isTrackAll } from "@next-core/cook";
import { hasOwnProperty } from "@next-core/utils/general";
import { strictCollectMemberUsage } from "@next-core/utils/storyboard";
import { debounce, isEqual } from "lodash";
import { asyncCheckBrickIf } from "./compute/checkIf.js";
import {
  asyncComputeRealPropertyEntries,
  constructAsyncProperties,
} from "./compute/computeRealProperties.js";
import { resolveData } from "./data/resolveData.js";
import { asyncComputeRealValue } from "./compute/computeRealValue.js";
import {
  TrackingContextItem,
  listenOnTrackingContext,
} from "./compute/listenOnTrackingContext.js";
import { RendererContext } from "./RendererContext.js";
import { matchRoute, matchRoutes } from "./matchRoutes.js";
import {
  symbolForAsyncComputedPropsFromHost,
  symbolForTPlExternalForEachIndex,
  symbolForTPlExternalForEachItem,
  symbolForTplStateStoreId,
} from "./CustomTemplates/constants.js";
import { expandCustomTemplate } from "./CustomTemplates/expandCustomTemplate.js";
import type {
  RenderBrick,
  RenderChildNode,
  RenderReturnNode,
  RuntimeBrickConfWithSymbols,
  RuntimeContext,
} from "./interfaces.js";
import {
  getTagNameOfCustomTemplate,
  getTplStateStore,
} from "./CustomTemplates/utils.js";
import { customTemplates } from "../CustomTemplates.js";
import type { NextHistoryState } from "./historyExtended.js";
import { getBrickPackages, hooks } from "./Runtime.js";
import { RenderTag } from "./enums.js";
import { getTracks } from "./compute/getTracks.js";
import { isStrictMode, warnAboutStrictMode } from "../isStrictMode.js";
import {
  FORM_RENDERER,
  RuntimeBrickConfOfFormSymbols,
  symbolForFormStateStoreId,
} from "./FormRenderer/constants.js";
import { expandFormRenderer } from "./FormRenderer/expandFormRenderer.js";
import { isPreEvaluated } from "./compute/evaluate.js";
import { getPreEvaluatedRaw } from "./compute/evaluate.js";
import { RuntimeBrickConfOfTplSymbols } from "./CustomTemplates/constants.js";
import { matchHomepage } from "./matchStoryboard.js";
import type { DataStore, DataStoreType } from "./data/DataStore.js";
import { listenerFactory } from "./bindListeners.js";
import type { MatchResult } from "./matchPath.js";

export interface RenderOutput {
  node?: RenderChildNode;
  unauthenticated?: boolean;
  redirect?: {
    path: string;
    state?: NextHistoryState;
  };
  route?: RouteConf;
  path?: string;
  blockingList: (Promise<unknown> | undefined)[];
  menuRequests: Promise<StaticMenuConf>[];
  hasTrackingControls?: boolean;
}

export async function renderRoutes(
  returnNode: RenderReturnNode,
  routes: RouteConf[],
  _runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  parentRoutes: RouteConf[],
  slotId?: string,
  isIncremental?: boolean
): Promise<RenderOutput> {
  const matched = await matchRoutes(routes, _runtimeContext);
  const output = getEmptyRenderOutput();
  switch (matched) {
    case "missed":
      break;
    case "unauthenticated":
      output.unauthenticated = true;
      break;
    default: {
      const route = (output.route = matched.route);
      output.path = matched.match.path;
      const runtimeContext = {
        ..._runtimeContext,
        match: matched.match,
      };
      if (isIncremental) {
        runtimeContext.ctxStore.disposeDataInRoutes(routes);
      }
      const routePath = parentRoutes.concat(route);
      runtimeContext.ctxStore.define(
        route.context,
        runtimeContext,
        undefined,
        routePath
      );
      runtimeContext.pendingPermissionsPreCheck.push(
        hooks?.checkPermissions?.preCheckPermissionsForBrickOrRoute(
          route,
          (value) => asyncComputeRealValue(value, runtimeContext)
        )
      );

      // Currently, this is only used for brick size-checking: these bricks
      // will be loaded before page rendering, but they will NOT be rendered.
      const { preLoadBricks } = route as { preLoadBricks?: string[] };
      if (Array.isArray(preLoadBricks)) {
        output.blockingList.push(
          loadBricksImperatively(preLoadBricks, getBrickPackages())
        );
      }

      if (route.type === "redirect") {
        let redirectTo: unknown;
        if (typeof route.redirect === "string") {
          redirectTo = await asyncComputeRealValue(
            route.redirect,
            runtimeContext
          );
        } else {
          const resolved = (await resolveData(
            {
              transform: "redirect",
              ...route.redirect,
            },
            runtimeContext
          )) as { redirect?: unknown };
          redirectTo = resolved.redirect;
        }
        if (typeof redirectTo !== "string") {
          // eslint-disable-next-line no-console
          console.error("Unexpected redirect result:", redirectTo);
          throw new Error(
            `Unexpected type of redirect result: ${typeof redirectTo}`
          );
        }
        output.redirect = { path: redirectTo };
      } else {
        const menuRequest = loadMenu(route.menu, runtimeContext);
        if (menuRequest) {
          output.menuRequests.push(menuRequest);
        }

        if (route.type === "routes") {
          const newOutput = await renderRoutes(
            returnNode,
            route.routes,
            runtimeContext,
            rendererContext,
            routePath,
            slotId
          );
          mergeRenderOutput(output, newOutput);
        } else {
          const newOutput = await renderBricks(
            returnNode,
            route.bricks,
            runtimeContext,
            rendererContext,
            routePath,
            slotId
          );
          mergeRenderOutput(output, newOutput);
        }

        if (returnNode.tag === RenderTag.BRICK) {
          rendererContext.memoizeMenuRequests(route, output.menuRequests);
        }
      }
    }
  }

  return output;
}

export async function renderBricks(
  returnNode: RenderReturnNode,
  bricks: BrickConf[],
  runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  parentRoutes: RouteConf[],
  slotId?: string,
  tplStack?: Map<string, number>,
  keyPath?: number[]
): Promise<RenderOutput> {
  const output = getEmptyRenderOutput();
  const kPath = keyPath ?? [];
  // 多个构件并行异步转换，但转换的结果按原顺序串行合并。
  const rendered = await Promise.all(
    bricks.map((brickConf, index) =>
      renderBrick(
        returnNode,
        brickConf,
        runtimeContext,
        rendererContext,
        parentRoutes,
        slotId,
        kPath.concat(index),
        tplStack && new Map(tplStack)
      )
    )
  );

  rendered.forEach((item, index) => {
    if (item.hasTrackingControls) {
      // Memoize a render node before it's been merged.
      rendererContext.memoize(
        slotId,
        kPath.concat(index),
        item.node,
        returnNode
      );
    }
    mergeRenderOutput(output, item);
  });

  return output;
}

export async function renderBrick(
  returnNode: RenderReturnNode,
  brickConf: RuntimeBrickConfWithSymbols,
  _runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  parentRoutes: RouteConf[],
  slotId?: string,
  keyPath: number[] = [],
  tplStack = new Map<string, number>()
): Promise<RenderOutput> {
  const output = getEmptyRenderOutput();

  if (!brickConf.brick) {
    if ((brickConf as { template?: string }).template) {
      // eslint-disable-next-line no-console
      console.error("Legacy templates are dropped in v3:", brickConf);
    } else {
      // eslint-disable-next-line no-console
      console.error("Invalid brick:", brickConf);
    }
    return output;
  }

  // Translate `if: "<%= ... %>"` to `brick: ":if", dataSource: "<%= ... %>"`.
  // In other words, translate tracking if expressions to tracking control nodes of `:if`.
  const { if: brickIf, permissionsPreCheck, ...restBrickConf } = brickConf;
  if (isGeneralizedTrackAll(brickIf)) {
    return renderBrick(
      returnNode,
      {
        brick: ":if",
        dataSource: brickIf,
        // `permissionsPreCheck` maybe required before computing `if`.
        permissionsPreCheck,
        slots: {
          "": {
            type: "bricks",
            bricks: [restBrickConf],
          },
        },
        // These symbols have to be copied to the new brick conf.
        ...Object.getOwnPropertySymbols(brickConf).reduce(
          (acc, symbol) => ({
            ...acc,
            [symbol]: (brickConf as any)[symbol],
          }),
          {} as RuntimeBrickConfOfTplSymbols & RuntimeBrickConfOfFormSymbols
        ),
      },
      _runtimeContext,
      rendererContext,
      parentRoutes,
      slotId,
      keyPath,
      tplStack
    );
  }

  const tplStateStoreId = brickConf[symbolForTplStateStoreId];
  const formStateStoreId = brickConf[symbolForFormStateStoreId];
  const runtimeContext = {
    ..._runtimeContext,
    tplStateStoreId,
    formStateStoreId,
  };

  if (hasOwnProperty(brickConf, symbolForTPlExternalForEachItem)) {
    // The external bricks of a template should restore their `forEachItem` and
    // `forEachIndex` from their host.
    runtimeContext.forEachItem = brickConf[symbolForTPlExternalForEachItem];
    runtimeContext.forEachIndex = brickConf[symbolForTPlExternalForEachIndex];
  }

  const { context } = brickConf as { context?: ContextConf[] };
  // istanbul ignore next
  if (Array.isArray(context) && context.length > 0) {
    const strict = isStrictMode(runtimeContext);
    warnAboutStrictMode(
      strict,
      "Defining context on bricks",
      "check your brick:",
      brickConf
    );
    if (!strict) {
      runtimeContext.ctxStore.define(context, runtimeContext);
    }
  }

  runtimeContext.pendingPermissionsPreCheck.push(
    hooks?.checkPermissions?.preCheckPermissionsForBrickOrRoute(
      brickConf,
      (value) => asyncComputeRealValue(value, runtimeContext)
    )
  );

  if (!(await asyncCheckBrickIf(brickConf, runtimeContext))) {
    return output;
  }

  const brickName = brickConf.brick;
  if (brickName.startsWith(":")) {
    ensureValidControlBrick(brickName);

    const { dataSource } = brickConf;

    const lowerLevelRenderControlNode = async (
      runtimeContext: RuntimeContext
    ) => {
      // First, compute the `dataSource`
      const computedDataSource = await asyncComputeRealValue(
        dataSource,
        runtimeContext
      );

      // Then, get the matched slot.
      const slot =
        brickName === ":forEach"
          ? ""
          : brickName === ":switch"
            ? String(computedDataSource)
            : computedDataSource
              ? ""
              : "else";

      // Don't forget to transpile children to slots.
      const slots = childrenToSlots(brickConf.children, brickConf.slots);

      // Then, get the bricks in that matched slot.
      const bricks =
        slots &&
        hasOwnProperty(slots, slot) &&
        (slots[slot] as SlotConfOfBricks)?.bricks;

      if (!Array.isArray(bricks)) {
        return getEmptyRenderOutput();
      }

      switch (brickName) {
        case ":forEach": {
          if (!Array.isArray(computedDataSource)) {
            return getEmptyRenderOutput();
          }
          return renderForEach(
            returnNode,
            computedDataSource,
            bricks,
            runtimeContext,
            rendererContext,
            parentRoutes,
            slotId,
            tplStack,
            keyPath
          );
        }
        case ":if":
        case ":switch": {
          return renderBricks(
            returnNode,
            bricks,
            runtimeContext,
            rendererContext,
            parentRoutes,
            slotId,
            tplStack,
            keyPath
          );
        }
      }
    };

    const renderControlNode = async (runtimeContext: RuntimeContext) => {
      const rawOutput = await lowerLevelRenderControlNode(runtimeContext);
      rawOutput.node ??= {
        tag: RenderTag.PLACEHOLDER,
        return: returnNode,
      };
      return rawOutput;
    };

    const controlledOutput = await renderControlNode(runtimeContext);
    const { onMount, onUnmount } = brickConf.lifeCycle ?? {};

    const { contextNames, stateNames } = getTracks(dataSource);
    if (contextNames || stateNames) {
      controlledOutput.hasTrackingControls = true;
      let renderId = 0;
      const listener = async () => {
        const currentRenderId = ++renderId;
        const [scopedRuntimeContext, tplStateStoreScope, formStateStoreScope] =
          createScopedRuntimeContext(runtimeContext);

        const reControlledOutput =
          await renderControlNode(scopedRuntimeContext);

        const scopedStores = [...tplStateStoreScope, ...formStateStoreScope];
        await postAsyncRender(
          reControlledOutput,
          scopedRuntimeContext,
          scopedStores
        );

        // Ignore stale renders
        if (renderId === currentRenderId) {
          if (onUnmount) {
            listenerFactory(
              onUnmount,
              runtimeContext
            )(new CustomEvent("unmount", { detail: { rerender: true } }));
          }

          rendererContext.reRender(
            slotId,
            keyPath,
            reControlledOutput.node,
            returnNode
          );

          if (onMount) {
            listenerFactory(
              onMount,
              scopedRuntimeContext
            )(new CustomEvent("mount", { detail: { rerender: true } }));
          }

          for (const store of scopedStores) {
            store.mountAsyncData();
          }
        }
      };
      const debouncedListener = debounce(listener);
      if (contextNames) {
        for (const contextName of contextNames) {
          runtimeContext.ctxStore.onChange(contextName, debouncedListener);
        }
      }
      if (stateNames) {
        for (const contextName of stateNames) {
          const tplStateStore = getTplStateStore(
            runtimeContext,
            "STATE",
            `: "${dataSource}"`
          );
          tplStateStore.onChange(contextName, debouncedListener);
        }
      }
    }

    if (onMount) {
      rendererContext.registerArbitraryLifeCycle("onMount", () => {
        listenerFactory(
          onMount,
          runtimeContext
        )(new CustomEvent("mount", { detail: { rerender: false } }));
      });
    }

    if (onUnmount) {
      rendererContext.registerArbitraryLifeCycle("onUnmount", () => {
        listenerFactory(
          onUnmount,
          runtimeContext
        )(new CustomEvent("unmount", { detail: { rerender: false } }));
      });
    }

    return controlledOutput;
  }

  // Widgets need to be defined before rendering.
  if (/\.tpl-/.test(brickName) && !customTemplates.get(brickName)) {
    await catchLoad(
      loadBricksImperatively([brickName], getBrickPackages()),
      "brick",
      brickName,
      rendererContext.unknownBricks
    );
  }

  const tplTagName = getTagNameOfCustomTemplate(
    brickName,
    runtimeContext.app?.id
  );

  if (tplTagName) {
    const tplCount = tplStack.get(tplTagName) ?? 0;
    if (tplCount >= 10) {
      throw new Error(
        `Maximum custom template stack overflowed: "${tplTagName}"`
      );
    }
    tplStack.set(tplTagName, tplCount + 1);
  } else if (brickName.includes("-") && !customElements.get(brickName)) {
    if (brickName === FORM_RENDERER) {
      customElements.define(
        FORM_RENDERER,
        class FormRendererElement extends HTMLElement {
          get $$typeof(): string {
            return "form-renderer";
          }
        }
      );
    } else {
      output.blockingList.push(
        catchLoad(
          enqueueStableLoadBricks([brickName], getBrickPackages()),
          "brick",
          brickName,
          rendererContext.unknownBricks
        )
      );
    }
  }

  let formData: unknown;
  let confProps: Record<string, unknown> | undefined;
  if (brickName === FORM_RENDERER) {
    ({ formData, ...confProps } = brickConf.properties ?? {});
  } else {
    confProps = brickConf.properties;
  }

  const trackingContextList: TrackingContextItem[] = [];
  const asyncPropertyEntries = asyncComputeRealPropertyEntries(
    confProps,
    runtimeContext,
    trackingContextList
  );

  const computedPropsFromHost = brickConf[symbolForAsyncComputedPropsFromHost];
  if (computedPropsFromHost) {
    asyncPropertyEntries.push(...computedPropsFromHost);
  }

  const isScript = brickName === "script";
  if (isScript || brickName === "link") {
    const props = await constructAsyncProperties(asyncPropertyEntries);
    if (isScript ? props.src : props.rel === "stylesheet" && props.href) {
      const prefix = window.PUBLIC_ROOT ?? "";
      if (isScript) {
        const { src, ...attrs } = props;
        await catchLoad(
          loadScript(src as string, prefix, attrs),
          "script",
          src as string,
          "silent"
        );
      } else {
        const { href, ...attrs } = props;
        await catchLoad(
          loadStyle(href as string, prefix, attrs),
          "stylesheet",
          href as string,
          "silent"
        );
      }
      return output;
    }
  }

  const brick: RenderBrick = {
    tag: RenderTag.BRICK,
    type: tplTagName || brickName,
    return: returnNode,
    slotId,
    events: brickConf.events,
    runtimeContext,
    portal: brickConf.portal,
    iid: brickConf.iid,
    ref: (brickConf as BrickConfInTemplate).ref,
  };

  output.node = brick;

  // 在最终挂载前，先加载所有可能用到的 processors。
  const usedProcessors = strictCollectMemberUsage(
    [brickConf.events, brickConf.lifeCycle],
    "PROCESSORS",
    2
  );
  if (usedProcessors.size > 0) {
    output.blockingList.push(
      catchLoad(
        loadProcessorsImperatively(usedProcessors, getBrickPackages()),
        "processors",
        [...usedProcessors].join(", "),
        rendererContext.unknownBricks
      )
    );
  }

  // 加载构件属性和加载子构件等任务，可以并行。
  const blockingList: Promise<unknown>[] = [];

  const loadProperties = async () => {
    brick.properties = await constructAsyncProperties(asyncPropertyEntries);
    listenOnTrackingContext(brick, trackingContextList);
  };
  blockingList.push(loadProperties());

  rendererContext.registerBrickLifeCycle(brick, brickConf.lifeCycle);

  let expandedBrickConf = brickConf;
  if (tplTagName) {
    expandedBrickConf = expandCustomTemplate(
      tplTagName,
      brickConf,
      brick,
      asyncPropertyEntries,
      rendererContext
    );
  } else if (brickName === FORM_RENDERER) {
    expandedBrickConf = expandFormRenderer(
      formData,
      brickConf,
      brick,
      asyncPropertyEntries,
      rendererContext
    );
  }

  if (expandedBrickConf.portal) {
    // A portal brick has no slotId.
    brick.slotId = undefined;
  }

  let childRuntimeContext: RuntimeContext;
  if (tplTagName) {
    // There is a boundary for `forEachItem` between template internals and externals.
    childRuntimeContext = {
      ...runtimeContext,
    };
    delete childRuntimeContext.forEachItem;
    delete childRuntimeContext.forEachIndex;
  } else {
    childRuntimeContext = runtimeContext;
  }

  const loadChildren = async () => {
    const slots = childrenToSlots(
      expandedBrickConf.children,
      expandedBrickConf.slots
    );
    if (!slots) {
      return;
    }
    const routeSlotFromIndexToSlotId = new Map<number, string>();
    const rendered = await Promise.all(
      Object.entries(slots).map(([childSlotId, slotConf], index) => {
        if (slotConf.type !== "routes") {
          return renderBricks(
            brick,
            (slotConf as SlotConfOfBricks).bricks,
            childRuntimeContext,
            rendererContext,
            parentRoutes,
            childSlotId,
            tplStack
          );
        }

        const parentRoute = parentRoutes[parentRoutes.length - 1] as
          | RouteConfOfBricks
          | undefined;
        if (parentRoute?.incrementalSubRoutes) {
          routeSlotFromIndexToSlotId.set(index, childSlotId);
          rendererContext.performIncrementalRender(
            async (location, prevLocation) => {
              const { homepage } = childRuntimeContext.app;
              const { pathname } = location;
              // Ignore if any one of homepage and parent routes not matched.
              if (
                !matchHomepage(homepage, pathname) ||
                !parentRoutes.every((route) => {
                  let prevMatch: MatchResult | null;
                  let newMatch: MatchResult | null;
                  return (
                    (prevMatch = matchRoute(
                      route,
                      homepage,
                      prevLocation.pathname
                    )) &&
                    (newMatch = matchRoute(route, homepage, pathname)) &&
                    (route !== parentRoute ||
                      isEqual(prevMatch.params, newMatch.params))
                  );
                })
              ) {
                return false;
              }

              const [
                scopedRuntimeContext,
                tplStateStoreScope,
                formStateStoreScope,
              ] = createScopedRuntimeContext({
                ...childRuntimeContext,
                location,
                query: new URLSearchParams(location.search),
              });

              let failed = false;
              let incrementalOutput: RenderOutput;
              let scopedStores: DataStore<"STATE" | "FORM_STATE">[] = [];

              try {
                incrementalOutput = await renderRoutes(
                  brick,
                  slotConf.routes,
                  scopedRuntimeContext,
                  rendererContext,
                  parentRoutes,
                  childSlotId,
                  true
                );

                // Do not ignore incremental rendering even if all sub-routes are missed.
                // Since parent route is matched.

                // Bailout if redirect or unauthenticated is set
                if (rendererContext.reBailout(incrementalOutput)) {
                  return true;
                }

                scopedStores = [...tplStateStoreScope, ...formStateStoreScope];
                await postAsyncRender(incrementalOutput, scopedRuntimeContext, [
                  scopedRuntimeContext.ctxStore,
                  ...scopedStores,
                ]);

                await rendererContext.reMergeMenuRequests(
                  slotConf.routes,
                  incrementalOutput.route,
                  incrementalOutput.menuRequests
                );
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error("Incremental sub-router failed:", error);

                const result = rendererContext.reCatch(error, brick);
                if (!result) {
                  return true;
                }
                ({ failed, output: incrementalOutput } = result);

                // Assert: no errors will be throw
                await rendererContext.reMergeMenuRequests(
                  slotConf.routes,
                  incrementalOutput.route,
                  incrementalOutput.menuRequests
                );
              }

              rendererContext.reRender(
                childSlotId,
                [],
                incrementalOutput.node,
                brick
              );

              if (!failed) {
                scopedRuntimeContext.ctxStore.mountAsyncData(
                  incrementalOutput.route
                );
                for (const store of scopedStores) {
                  store.mountAsyncData();
                }
              }

              return true;
            }
          );
        }

        return renderRoutes(
          brick,
          slotConf.routes,
          childRuntimeContext,
          rendererContext,
          parentRoutes,
          childSlotId
        );
      })
    );

    const childrenOutput: RenderOutput = {
      ...output,
      node: undefined,
      blockingList: [],
      menuRequests: [],
    };
    rendered.forEach((item, index) => {
      if (routeSlotFromIndexToSlotId.has(index)) {
        // Memoize a render node before it's been merged.
        rendererContext.memoize(
          routeSlotFromIndexToSlotId.get(index),
          [],
          item.node,
          brick
        );
      }
      mergeRenderOutput(childrenOutput, item);
    });
    if (childrenOutput.node) {
      brick.child = childrenOutput.node;
    }
    mergeRenderOutput(output, {
      ...childrenOutput,
      node: undefined,
    });
  };
  blockingList.push(loadChildren());

  await Promise.all(blockingList);

  return output;
}

function isGeneralizedTrackAll(brickIf: unknown): boolean {
  return typeof brickIf === "string"
    ? isTrackAll(brickIf)
    : isPreEvaluated(brickIf) &&
        // istanbul ignore next: covered by e2e tests
        isTrackAll(getPreEvaluatedRaw(brickIf));
}

type ValidControlBrick = ":forEach" | ":if" | ":switch";

function ensureValidControlBrick(
  brick: string
): asserts brick is ValidControlBrick {
  if (brick !== ":forEach" && brick !== ":if" && brick !== ":switch") {
    throw new Error(`Unknown storyboard control node: "${brick}"`);
  }
}

async function renderForEach(
  returnNode: RenderReturnNode,
  dataSource: unknown[],
  bricks: BrickConf[],
  runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  parentRoutes: RouteConf[],
  slotId: string | undefined,
  tplStack: Map<string, number>,
  keyPath: number[]
): Promise<RenderOutput> {
  const output = getEmptyRenderOutput();

  const rows = dataSource.length;
  const rendered = await Promise.all(
    dataSource.map((item, i) =>
      Promise.all(
        bricks.map((brickConf, j) =>
          renderBrick(
            returnNode,
            brickConf,
            {
              ...runtimeContext,
              forEachItem: item,
              forEachIndex: i,
            },
            rendererContext,
            parentRoutes,
            slotId,
            keyPath.concat(i * rows + j),
            tplStack && new Map(tplStack)
          )
        )
      )
    )
  );

  // 多层构件并行异步转换，但转换的结果按原顺序串行合并。
  rendered.flat().forEach((item, index) => {
    if (item.hasTrackingControls) {
      // Memoize a render node before it's been merged.
      rendererContext.memoize(
        slotId,
        keyPath.concat(index),
        item.node,
        returnNode
      );
    }
    mergeRenderOutput(output, item);
  });

  return output;
}

export function getDataStores(runtimeContext: RuntimeContext) {
  return [
    runtimeContext.ctxStore,
    ...runtimeContext.tplStateStoreMap.values(),
    ...runtimeContext.formStateStoreMap.values(),
  ];
}

export function postAsyncRender(
  output: RenderOutput,
  runtimeContext: RuntimeContext,
  stores: DataStore<DataStoreType>[]
) {
  flushStableLoadBricks();

  return Promise.all([
    ...output.blockingList,
    ...stores.map((store) => store.waitForAll()),
    ...runtimeContext.pendingPermissionsPreCheck,
  ]);
}

export function createScopedRuntimeContext(
  runtimeContext: RuntimeContext
): [
  scopedRuntimeContext: RuntimeContext,
  tplStateStoreScope: DataStore<"STATE">[],
  formStateStoreScope: DataStore<"FORM_STATE">[],
] {
  const tplStateStoreScope: DataStore<"STATE">[] = [];
  const formStateStoreScope: DataStore<"FORM_STATE">[] = [];
  const scopedRuntimeContext: RuntimeContext = {
    ...runtimeContext,
    tplStateStoreScope,
    formStateStoreScope,
  };
  return [scopedRuntimeContext, tplStateStoreScope, formStateStoreScope];
}

function loadMenu(
  menuConf: MenuConf | undefined,
  runtimeContext: RuntimeContext
) {
  if (!menuConf) {
    return;
  }

  // istanbul ignore next
  if ((menuConf as { type?: "brick" }).type === "brick") {
    // eslint-disable-next-line no-console
    console.error("Set menu with brick is dropped in v3:", menuConf);
    throw new Error("Set menu with brick is dropped in v3");
  }

  // istanbul ignore next
  if (menuConf.type === "resolve") {
    // eslint-disable-next-line no-console
    console.warn("Set menu with resolve is not supported in v3 yet:", menuConf);
    return;
  }

  return asyncComputeRealValue(
    menuConf,
    runtimeContext
  ) as Promise<StaticMenuConf>;
}

function mergeRenderOutput(
  output: RenderOutput,
  newOutput: RenderOutput
): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { blockingList, node, menuRequests, hasTrackingControls, ...rest } =
    newOutput;
  output.blockingList.push(...blockingList);
  output.menuRequests.push(...menuRequests);

  if (node) {
    if (output.node) {
      let last = output.node;
      while (last.sibling) {
        last = last.sibling;
      }
      last.sibling = node;
    } else {
      output.node = node;
    }
  }

  Object.assign(output, rest);
}

function getEmptyRenderOutput(): RenderOutput {
  return {
    blockingList: [],
    menuRequests: [],
  };
}

export function childrenToSlots(
  children: BrickConf[] | undefined,
  originalSlots: SlotsConf | undefined
) {
  let newSlots = originalSlots;
  // istanbul ignore next
  if (
    process.env.NODE_ENV === "development" &&
    children &&
    !Array.isArray(children)
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "Specified brick children but not array:",
      `<${typeof children}>`,
      children
    );
  }
  if (Array.isArray(children) && !newSlots) {
    newSlots = {};
    for (const child of children) {
      const slot = child.slot ?? "";
      if (!hasOwnProperty(newSlots, slot)) {
        newSlots[slot] = {
          type: "bricks",
          bricks: [],
        };
      }
      (newSlots[slot] as SlotConfOfBricks).bricks.push(child);
    }
  }
  return newSlots;
}

function catchLoad(
  promise: Promise<unknown>,
  type: "brick" | "processors" | "script" | "stylesheet",
  name: string,
  unknownPolicy: RendererContext["unknownBricks"]
) {
  return unknownPolicy === "silent"
    ? promise.catch((e) => {
        // eslint-disable-next-line no-console
        console.error(`Load %s "%s" failed:`, type, name, e);
      })
    : promise;
}
