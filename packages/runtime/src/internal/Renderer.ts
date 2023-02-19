import type { BrickConf, RouteConf, SlotConfOfBricks } from "@next-core/types";
import {
  enqueueStableLoadBricks,
  loadBricksImperatively,
} from "@next-core/loader";
import { hasOwnProperty, isObject } from "@next-core/utils/general";
import { checkBrickIf } from "./compute/checkIf.js";
import { asyncComputeRealProperties } from "./compute/computeRealProperties.js";
import { resolveData } from "./data/resolveData.js";
import {
  asyncComputeRealValue,
  computeRealValue,
} from "./compute/computeRealValue.js";
import { validatePermissions } from "./checkPermissions.js";
import {
  TrackingContextItem,
  listenOnTrackingContext,
} from "./compute/listenOnTrackingContext.js";
import { RendererContext } from "./RendererContext.js";
import { matchRoutes } from "./matchRoutes.js";
import { getAuth, isLoggedIn } from "../auth.js";
import {
  RuntimeBrickConfWithTplSymbols,
  symbolForAsyncComputedPropsFromHost,
  symbolForBrickHolder,
  symbolForTPlExternalForEachItem,
  symbolForTplStateStoreId,
} from "./CustomTemplates/constants.js";
import { expandCustomTemplate } from "./CustomTemplates/expandCustomTemplate.js";
import type { RuntimeBrick, RuntimeContext } from "./interfaces.js";
import { getTagNameOfCustomTemplate } from "./CustomTemplates/utils.js";
import { customTemplates } from "../CustomTemplates.js";
import type { NextHistoryState } from "./historyExtended.js";

export interface RenderOutput {
  main: RuntimeBrick[];
  portal: RuntimeBrick[];
  unauthenticated?: boolean;
  redirect?: {
    path: string;
    state?: NextHistoryState;
  };
  route?: RouteConf;
  blockingList: (Promise<unknown> | undefined)[];
}
export async function renderRoutes(
  routes: RouteConf[],
  _runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  slotId?: string
): Promise<RenderOutput> {
  const matched = await matchRoutes(routes, _runtimeContext);
  const output: RenderOutput = {
    main: [],
    portal: [],
    blockingList: [],
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
          const newOutput = await renderRoutes(
            route.routes,
            runtimeContext,
            rendererContext,
            slotId
          );
          mergeRenderOutput(output, newOutput);
          break;
        }
        default: {
          const newOutput = await renderBricks(
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
  bricks: BrickConf[],
  runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  slotId?: string,
  tplStack?: Map<string, number>
): Promise<RenderOutput> {
  const output: RenderOutput = {
    main: [],
    portal: [],
    blockingList: [],
  };
  // 多个构件并行异步转换，但转换的结果按原顺序串行合并。
  const rendered = await Promise.all(
    bricks.map((brickConf) =>
      renderBrick(
        brickConf,
        runtimeContext,
        rendererContext,
        slotId,
        tplStack && new Map(tplStack)
      )
    )
  );
  for (const item of rendered) {
    mergeRenderOutput(output, item);
  }
  return output;
}

export async function renderBrick(
  brickConf: RuntimeBrickConfWithTplSymbols,
  _runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  slotId?: string,
  tplStack = new Map<string, number>()
): Promise<RenderOutput> {
  const output: RenderOutput = {
    main: [],
    portal: [],
    blockingList: [],
  };

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

  if (!(await checkBrickIf(brickConf, runtimeContext))) {
    return output;
  }

  runtimeContext.pendingPermissionsPreCheck.push(
    preCheckPermissionsForBrickOrRoute(brickConf, runtimeContext)
  );

  if (brickConf.brick.startsWith(":")) {
    // First, get the `dataSource`
    const dataSource = await computeRealValue(
      brickConf.dataSource,
      runtimeContext
    );

    // Then, get the matched slot.
    const slot =
      brickConf.brick === ":forEach"
        ? ""
        : brickConf.brick === ":switch"
        ? String(dataSource)
        : dataSource
        ? ""
        : "else";

    // Don't forget to transpile children to slots.
    const slots = childrenToSlots(brickConf);

    // Then, get the bricks in that matched slot.
    const bricks =
      slots &&
      hasOwnProperty(slots, slot) &&
      (slots[slot] as SlotConfOfBricks)?.bricks;

    if (!Array.isArray(bricks)) {
      return output;
    }

    switch (brickConf.brick) {
      case ":forEach": {
        if (!Array.isArray(dataSource)) {
          return output;
        }
        return renderForEach(
          dataSource,
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
          bricks,
          runtimeContext,
          rendererContext,
          slotId,
          tplStack
        );
      }
      default:
        throw new Error(
          `Unknown storyboard control node: "${brickConf.brick}"`
        );
    }
  }

  // Custom templates need to be defined before rendering.
  if (/\.tpl-/.test(brickConf.brick) && !customTemplates.get(brickConf.brick)) {
    await loadBricksImperatively(
      [brickConf.brick],
      runtimeContext.brickPackages
    );
  }

  const tplTagName = getTagNameOfCustomTemplate(
    brickConf.brick,
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

  if (brickConf.brick.includes(".")) {
    output.blockingList.push(
      enqueueStableLoadBricks([brickConf.brick], runtimeContext.brickPackages)
    );
  }

  const brick: RuntimeBrick = {
    type: tplTagName || brickConf.brick,
    children: [],
    slotId,
    events: brickConf.events,
    runtimeContext,
  };

  const brickHolder = brickConf[symbolForBrickHolder];
  if (brickHolder) {
    brickHolder.brick = brick;
  }

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
    // Make parent portal bricks appear before child bricks.
    // This makes z-index of a child brick be higher than its parent.
    output.portal.push(brick);
  } else {
    output.main.push(brick);
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
    const slots = childrenToSlots(expandedBrickConf);
    if (!slots) {
      return;
    }
    const rendered = await Promise.all(
      Object.entries(slots).map(([childSlotId, slotConf]) =>
        slotConf.type !== "routes"
          ? renderBricks(
              (slotConf as SlotConfOfBricks).bricks,
              childRuntimeContext,
              rendererContext,
              childSlotId,
              tplStack
            )
          : renderRoutes(
              slotConf.routes,
              childRuntimeContext,
              rendererContext,
              childSlotId
            )
      )
    );

    const childrenOutput: RenderOutput = {
      ...output,
      main: brick.children,
    };
    for (const item of rendered) {
      mergeRenderOutput(childrenOutput, item);
    }
    mergeRenderOutput(output, {
      ...childrenOutput,
      main: [],
    });
  };
  blockingList.push(loadChildren());

  await Promise.all(blockingList);

  return output;
}

export async function renderForEach(
  dataSource: unknown[],
  bricks: BrickConf[],
  runtimeContext: RuntimeContext,
  rendererContext: RendererContext,
  slotId?: string,
  tplStack?: Map<string, number>
): Promise<RenderOutput> {
  const output: RenderOutput = {
    main: [],
    portal: [],
    blockingList: [],
  };

  const rendered = await Promise.all(
    dataSource.map((item) =>
      Promise.all(
        bricks.map((brickConf) =>
          renderBrick(
            brickConf,
            {
              ...runtimeContext,
              forEachItem: item,
            },
            rendererContext,
            slotId,
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

export function mergeRenderOutput(
  output: RenderOutput,
  newOutput: RenderOutput | undefined
): void {
  if (!newOutput) {
    return;
  }
  const { main, portal, blockingList: pendingPromises, ...rest } = newOutput;
  output.main.push(...main);
  output.portal.push(...portal);
  output.blockingList.push(...pendingPromises);
  Object.assign(output, rest);
}

function childrenToSlots(brick: BrickConf) {
  let { slots, children } = brick;
  if (Array.isArray(children) && !slots) {
    slots = {};
    for (const child of children) {
      const slot = child.slot ?? "";
      if (!hasOwnProperty(slots, slot)) {
        slots[slot] = {
          type: "bricks",
          bricks: [],
        };
      }
      (slots[slot] as SlotConfOfBricks).bricks.push(child);
    }
  }
  return slots;
}

async function preCheckPermissionsForBrickOrRoute(
  container: BrickConf | RouteConf,
  runtimeContext: RuntimeContext
) {
  if (
    isLoggedIn() &&
    !getAuth().isAdmin &&
    Array.isArray(container.permissionsPreCheck)
  ) {
    const actions = (await asyncComputeRealValue(
      container.permissionsPreCheck,
      runtimeContext
    )) as string[];
    return validatePermissions(actions);
  }
}
