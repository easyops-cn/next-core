import type {
  BrickConf,
  BrickEventsMap,
  PluginHistoryState,
  RouteConf,
  RuntimeContext,
} from "@next-core/brick-types";
import { enqueueStableLoadBricks } from "@next-core/loader";
import { isObject } from "@next-core/utils/general";
import { checkBrickIf } from "./compute/checkIf.js";
import { asyncComputeRealProperties } from "./compute/computeRealProperties.js";
import { resolveData } from "./data/resolveData.js";
import { asyncComputeRealValue } from "./compute/computeRealValue.js";
import { validatePermissions } from "./checkPermissions.js";
import { getTagNameOfCustomTemplate } from "../CustomTemplates.js";
import {
  TrackingContextItem,
  listenOnTrackingContext,
} from "./compute/listenOnTrackingContext.js";
import { RouterContext } from "./RouterContext.js";
import { matchRoutes } from "./matchRoutes.js";
import { getAuth, isLoggedIn } from "../auth.js";

export interface RenderOutput {
  main: RuntimeBrick[];
  portal: RuntimeBrick[];
  unauthenticated?: boolean;
  redirect?: {
    path: string;
    state?: PluginHistoryState;
  };
  route?: RouteConf;
  blockingList: (Promise<unknown> | undefined)[];
}

export interface RuntimeBrick {
  type: string;
  children: RuntimeBrick[];
  properties?: Record<string, unknown>;
  events?: BrickEventsMap;
  slotId?: string;
  element?: HTMLElement;
  iid?: string;
  runtimeContext: RuntimeContext;
}

export async function renderRoutes(
  routes: RouteConf[],
  runtimeContext: RuntimeContext,
  routerContext: RouterContext,
  slotId?: string
): Promise<RenderOutput> {
  const matched = await matchRoutes(routes, runtimeContext);
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
      runtimeContext.match = matched.match;
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
            routerContext,
            slotId
          );
          mergeRenderOutput(output, newOutput);
          break;
        }
        default: {
          const newOutput = await renderBricks(
            route.bricks,
            runtimeContext,
            routerContext,
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
  routerContext: RouterContext,
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
        routerContext,
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
  brickConf: BrickConf,
  runtimeContext: RuntimeContext,
  routerContext: RouterContext,
  slotId?: string,
  tplStack = new Map<string, number>()
): Promise<RenderOutput> {
  const output: RenderOutput = {
    main: [],
    portal: [],
    blockingList: [],
  };

  if (!(await checkBrickIf(brickConf, runtimeContext))) {
    return output;
  }

  const tplTagName = getTagNameOfCustomTemplate(
    brickConf.brick,
    runtimeContext.app.id
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

  runtimeContext.pendingPermissionsPreCheck.push(
    preCheckPermissionsForBrickOrRoute(brickConf, runtimeContext)
  );

  if (typeof brickConf.brick === "string" && brickConf.brick.includes(".")) {
    output.blockingList.push(
      enqueueStableLoadBricks([brickConf.brick], runtimeContext.brickPackages)
    );
  }

  const brick: RuntimeBrick = {
    type: brickConf.brick,
    children: [],
    slotId,
    events: brickConf.events,
    runtimeContext,
  };

  // 加载构件属性和加载子构件等任务，可以并行。
  const blockingList: Promise<unknown>[] = [];

  const trackingContextList: TrackingContextItem[] = [];
  const loadProperties = async () => {
    brick.properties = await asyncComputeRealProperties(
      brickConf.properties,
      runtimeContext,
      trackingContextList
    );
  };
  const propertiesReady = loadProperties();
  blockingList.push(propertiesReady);

  propertiesReady.then(() => {
    listenOnTrackingContext(brick, trackingContextList, runtimeContext);
  });

  routerContext.registerBrickLifeCycle(brick, brickConf.lifeCycle);

  if (brickConf.portal) {
    // A portal brick has no slotId.
    brick.slotId = undefined;
    // Make parent portal bricks appear before child bricks.
    // This makes z-index of a child brick be higher than its parent.
    output.portal.push(brick);
  } else {
    output.main.push(brick);
  }

  const loadChildren = async () => {
    if (!isObject(brickConf.slots)) {
      return;
    }
    const rendered = await Promise.all(
      Object.entries(brickConf.slots).map(([childSlotId, slotConf]) => {
        if (slotConf.type === "bricks") {
          return renderBricks(
            slotConf.bricks,
            runtimeContext,
            routerContext,
            childSlotId,
            tplStack
          );
        } else if (slotConf.type === "routes") {
          return renderRoutes(
            slotConf.routes,
            runtimeContext,
            routerContext,
            childSlotId
          );
        }
      })
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
