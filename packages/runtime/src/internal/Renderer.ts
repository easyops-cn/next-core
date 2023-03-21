import type {
  BrickConf,
  BrickConfInTemplate,
  ContextConf,
  MenuConf,
  RouteConf,
  SlotConfOfBricks,
  SlotsConf,
  StaticMenuConf,
} from "@next-core/types";
import {
  enqueueStableLoadBricks,
  loadBricksImperatively,
} from "@next-core/loader";
import { hasOwnProperty } from "@next-core/utils/general";
import { debounce } from "lodash";
import { asyncCheckBrickIf } from "./compute/checkIf.js";
import { asyncComputeRealProperties } from "./compute/computeRealProperties.js";
import { resolveData } from "./data/resolveData.js";
import { asyncComputeRealValue } from "./compute/computeRealValue.js";
import { preCheckPermissionsForBrickOrRoute } from "./checkPermissions.js";
import {
  TrackingContextItem,
  listenOnTrackingContext,
} from "./compute/listenOnTrackingContext.js";
import { RendererContext } from "./RendererContext.js";
import { matchRoutes } from "./matchRoutes.js";
import {
  RuntimeBrickConfWithTplSymbols,
  symbolForAsyncComputedPropsFromHost,
  symbolForTPlExternalForEachItem,
  symbolForTplStateStoreId,
} from "./CustomTemplates/constants.js";
import { expandCustomTemplate } from "./CustomTemplates/expandCustomTemplate.js";
import type { RenderBrick, RenderNode, RuntimeContext } from "./interfaces.js";
import {
  getTagNameOfCustomTemplate,
  getTplStateStore,
} from "./CustomTemplates/utils.js";
import { customTemplates } from "../CustomTemplates.js";
import type { NextHistoryState } from "./historyExtended.js";
import { getBrickPackages } from "./Runtime.js";
import { RenderTag } from "./enums.js";
import { getTracks } from "./compute/getTracks.js";

export interface RenderOutput {
  node?: RenderBrick;
  unauthenticated?: boolean;
  redirect?: {
    path: string;
    state?: NextHistoryState;
  };
  route?: RouteConf;
  blockingList: (Promise<unknown> | undefined)[];
  menuRequests: (Promise<StaticMenuConf | undefined> | undefined)[];
  hasTrackingControls?: boolean;
}

export async function renderRoutes(
  returnNode: RenderNode,
  routes: RouteConf[],
  _runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  slotId?: string
): Promise<RenderOutput> {
  const matched = await matchRoutes(routes, _runtimeContext);
  const output: RenderOutput = {
    blockingList: [],
    menuRequests: [],
  };
  switch (matched) {
    case "missed":
      break;
    case "unauthenticated":
      output.unauthenticated = true;
      break;
    default: {
      const route = (output.route = matched.route);
      const runtimeContext = {
        ..._runtimeContext,
        match: matched.match,
      };
      runtimeContext.ctxStore.define(route.context, runtimeContext);
      runtimeContext.pendingPermissionsPreCheck.push(
        preCheckPermissionsForBrickOrRoute(route, runtimeContext)
      );
      switch (route.type) {
        case "redirect": {
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
          break;
        }
        case "routes": {
          output.menuRequests.push(loadMenu(route.menu, runtimeContext));
          const newOutput = await renderRoutes(
            returnNode,
            route.routes,
            runtimeContext,
            rendererContext,
            slotId
          );
          mergeRenderOutput(output, newOutput);
          break;
        }
        default: {
          output.menuRequests.push(loadMenu(route.menu, runtimeContext));
          const newOutput = await renderBricks(
            returnNode,
            route.bricks,
            runtimeContext,
            rendererContext,
            slotId
          );
          mergeRenderOutput(output, newOutput);
        }
      }
    }
  }
  return output;
}

export async function renderBricks(
  returnNode: RenderNode,
  bricks: BrickConf[],
  runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  slotId?: string,
  tplStack?: Map<string, number>,
  noMemoize?: boolean
): Promise<RenderOutput> {
  const output: RenderOutput = {
    blockingList: [],
    menuRequests: [],
  };
  // 多个构件并行异步转换，但转换的结果按原顺序串行合并。
  const rendered = await Promise.all(
    bricks.map((brickConf, index) =>
      renderBrick(
        returnNode,
        brickConf,
        runtimeContext,
        rendererContext,
        slotId,
        index,
        tplStack && new Map(tplStack)
      )
    )
  );

  rendered.forEach((item, index) => {
    if (!noMemoize && item.hasTrackingControls) {
      // Memoize a render node before it's been merged.
      rendererContext.memoizeControlNode(slotId, index, item.node, returnNode);
    }
    mergeRenderOutput(output, item);
  });

  return output;
}

export async function renderBrick(
  returnNode: RenderNode,
  brickConf: RuntimeBrickConfWithTplSymbols,
  _runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  slotId?: string,
  key?: number,
  tplStack = new Map<string, number>()
): Promise<RenderOutput> {
  const output: RenderOutput = {
    blockingList: [],
    menuRequests: [],
  };

  if (!brickConf.brick) {
    // eslint-disable-next-line no-console
    console.error("Legacy templates are not supported in v3:", brickConf);
    return output;
  }

  const tplStateStoreId = brickConf[symbolForTplStateStoreId];
  const runtimeContext = {
    ..._runtimeContext,
    tplStateStoreId,
  };

  if (hasOwnProperty(brickConf, symbolForTPlExternalForEachItem)) {
    // The external bricks of a template should restore their `forEachItem`
    // from their host.
    runtimeContext.forEachItem = brickConf[symbolForTPlExternalForEachItem];
  }

  const { context } = brickConf as { context?: ContextConf[] };
  // istanbul ignore next
  if (Array.isArray(context) && context.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      "Defining context on bricks will be dropped in v3:",
      brickConf
    );
    runtimeContext.ctxStore.define(context, runtimeContext);
  }

  runtimeContext.pendingPermissionsPreCheck.push(
    preCheckPermissionsForBrickOrRoute(brickConf, runtimeContext)
  );

  if (!(await asyncCheckBrickIf(brickConf, runtimeContext))) {
    return output;
  }

  const brickName = brickConf.brick;
  if (brickName.startsWith(":")) {
    ensureValidControlBrick(brickName);

    const { dataSource } = brickConf;

    const renderControlNode = async () => {
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
        return output;
      }

      switch (brickName) {
        case ":forEach": {
          if (!Array.isArray(computedDataSource)) {
            return output;
          }
          return renderForEach(
            returnNode,
            computedDataSource,
            bricks,
            runtimeContext,
            rendererContext,
            slotId,
            tplStack
          );
        }
        case ":if":
        case ":switch": {
          return renderBricks(
            returnNode,
            bricks,
            runtimeContext,
            rendererContext,
            slotId,
            tplStack,
            true
          );
        }
      }
    };

    const controlledOutput = await renderControlNode();

    const { contextNames, stateNames } = getTracks(dataSource);
    if (contextNames || stateNames) {
      controlledOutput.hasTrackingControls = true;
      let renderId = 0;
      const listener = async () => {
        const currentRenderId = ++renderId;
        const output = await renderControlNode();
        output.blockingList.push(
          ...[...runtimeContext.tplStateStoreMap.values()].map((store) =>
            store.waitForAll()
          ),
          ...runtimeContext.pendingPermissionsPreCheck
        );
        await Promise.all(output.blockingList);
        // Ignore stale renders
        if (renderId === currentRenderId) {
          rendererContext.rerenderControlNode(
            slotId,
            key as number,
            output.node,
            returnNode
          );
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

    return controlledOutput;
  }

  // Custom templates need to be defined before rendering.
  if (/\.tpl-/.test(brickName) && !customTemplates.get(brickName)) {
    await loadBricksImperatively([brickName], getBrickPackages());
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
  }

  if (brickName.includes(".")) {
    output.blockingList.push(
      enqueueStableLoadBricks([brickName], getBrickPackages())
    );
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

  // 加载构件属性和加载子构件等任务，可以并行。
  const blockingList: Promise<unknown>[] = [];

  const trackingContextList: TrackingContextItem[] = [];
  const loadProperties = async () => {
    brick.properties = await asyncComputeRealProperties(
      brickConf.properties,
      runtimeContext,
      trackingContextList
    );
    const computedPropsFromHost =
      brickConf[symbolForAsyncComputedPropsFromHost];
    if (computedPropsFromHost) {
      brick.properties ??= {};
      const computed = await computedPropsFromHost;
      for (const [propName, propValue] of Object.entries(computed)) {
        brick.properties[propName] = propValue;
      }
    }
    return brick.properties;
  };
  const asyncProperties = loadProperties();
  blockingList.push(asyncProperties);

  asyncProperties.then(() => {
    listenOnTrackingContext(brick, trackingContextList);
  });

  rendererContext.registerBrickLifeCycle(brick, brickConf.lifeCycle);

  let expandedBrickConf = brickConf;
  if (tplTagName) {
    expandedBrickConf = expandCustomTemplate(
      tplTagName,
      brickConf,
      brick,
      asyncProperties
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
    const rendered = await Promise.all(
      Object.entries(slots).map(([childSlotId, slotConf]) =>
        slotConf.type !== "routes"
          ? renderBricks(
              brick,
              (slotConf as SlotConfOfBricks).bricks,
              childRuntimeContext,
              rendererContext,
              childSlotId,
              tplStack
            )
          : renderRoutes(
              brick,
              slotConf.routes,
              childRuntimeContext,
              rendererContext,
              childSlotId
            )
      )
    );

    const childrenOutput: RenderOutput = {
      ...output,
      node: undefined,
      blockingList: [],
    };
    for (const item of rendered) {
      mergeRenderOutput(childrenOutput, item);
    }
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

type ValidControlBrick = ":forEach" | ":if" | ":switch";

function ensureValidControlBrick(
  brick: string
): asserts brick is ValidControlBrick {
  if (brick !== ":forEach" && brick !== ":if" && brick !== ":switch") {
    throw new Error(`Unknown storyboard control node: "${brick}"`);
  }
}

async function renderForEach(
  returnNode: RenderNode,
  dataSource: unknown[],
  bricks: BrickConf[],
  runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  slotId: string | undefined,
  tplStack?: Map<string, number>
): Promise<RenderOutput> {
  const output: RenderOutput = {
    blockingList: [],
    menuRequests: [],
  };

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
            },
            rendererContext,
            slotId,
            i * j,
            tplStack && new Map(tplStack)
          )
        )
      )
    )
  );

  // 多层构件并行异步转换，但转换的结果按原顺序串行合并。
  for (const item of rendered.flat()) {
    mergeRenderOutput(output, item);
  }
  return output;
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
