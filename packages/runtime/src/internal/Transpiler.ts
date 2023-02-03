import type {
  BrickConf,
  BrickEventsMap,
  MatchResult,
  PluginHistoryState,
  RouteConf,
  RuntimeContext,
} from "@next-core/brick-types";
import { enqueueStableLoadBricks } from "@next-core/loader";
import { isObject } from "@next-core/utils/general";
import { checkBrickIf, checkIf } from "./checkIf.js";
import { computeRealProperties } from "./compute/computeRealProperties.js";
import { resolveData } from "./data/resolveData.js";
import { matchPath } from "./matchPath.js";
import { computeRealValue } from "./compute/computeRealValue.js";
import { validatePermissions } from "./checkPermissions.js";

export interface TranspileOutput {
  main: RuntimeBrick[];
  portal: RuntimeBrick[];
  unauthenticated?: boolean;
  redirect?: {
    path: string;
    state?: PluginHistoryState;
  };
  failed?: boolean;
  route?: RouteConf;
  blockingList: Promise<unknown>[];
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

export async function transpileRoutes(
  routes: RouteConf[],
  runtimeContext: RuntimeContext,
  slotId?: string
): Promise<TranspileOutput> {
  const matched = await matchRoutes(routes, runtimeContext);
  const output: TranspileOutput = {
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
      runtimeContext.ctxStore.define(route.context, runtimeContext);
      runtimeContext.pendingPermissionsPreCheck.push(
        preCheckPermissionsForBrickOrRoute(route, runtimeContext)
      );
      switch (route.type) {
        case "redirect": {
          let redirectTo: unknown;
          if (typeof route.redirect === "string") {
            redirectTo = await computeRealValue(route.redirect, runtimeContext);
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
          const newOutput = await transpileRoutes(
            route.routes,
            runtimeContext,
            slotId
          );
          mergeTranspileOutput(output, newOutput);
          break;
        }
        default: {
          const newOutput = await transpileBricks(
            route.bricks,
            runtimeContext,
            slotId
          );
          mergeTranspileOutput(output, newOutput);
        }
      }
    }
  }
  return output;
}

export async function transpileBricks(
  bricks: BrickConf[],
  runtimeContext: RuntimeContext,
  slotId?: string
): Promise<TranspileOutput> {
  const output: TranspileOutput = {
    main: [],
    portal: [],
    blockingList: [],
  };
  // 多个构件并行异步转换，但转换的结果按原顺序串行合并。
  const transpiled = await Promise.all(
    bricks.map((brickConf) => transpileBrick(brickConf, runtimeContext, slotId))
  );
  for (const item of transpiled) {
    mergeTranspileOutput(output, item);
  }
  return output;
}

export async function transpileBrick(
  brickConf: BrickConf,
  runtimeContext: RuntimeContext,
  slotId?: string
): Promise<TranspileOutput> {
  const output: TranspileOutput = {
    main: [],
    portal: [],
    blockingList: [],
  };

  if (!(await checkBrickIf(brickConf, runtimeContext))) {
    return output;
  }

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

  runtimeContext.pendingPermissionsPreCheck.push(
    preCheckPermissionsForBrickOrRoute(brickConf, runtimeContext)
  );

  const loadProperties = async () => {
    brick.properties = await computeRealProperties(
      brickConf.properties,
      runtimeContext
    );
  };
  blockingList.push(loadProperties());

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
    const transpiled = await Promise.all(
      Object.entries(brickConf.slots).map(([childSlotId, slotConf]) => {
        if (slotConf.type === "bricks") {
          return transpileBricks(slotConf.bricks, runtimeContext, childSlotId);
        } else if (slotConf.type === "routes") {
          return transpileRoutes(slotConf.routes, runtimeContext, childSlotId);
        }
      })
    );

    const childrenOutput: TranspileOutput = {
      ...output,
      main: brick.children,
    };
    for (const item of transpiled) {
      mergeTranspileOutput(childrenOutput, item);
    }
    mergeTranspileOutput(output, {
      ...childrenOutput,
      main: [],
    });
  };
  blockingList.push(loadChildren());

  await Promise.all(blockingList);

  return output;
}

export function mergeTranspileOutput(
  output: TranspileOutput,
  newOutput: TranspileOutput | undefined
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

type MatchRoutesResult =
  | {
      match: MatchResult;
      route: RouteConf;
    }
  | "missed"
  | "unauthenticated";

async function matchRoutes(
  routes: RouteConf[],
  runtimeContext: RuntimeContext
): Promise<MatchRoutesResult> {
  for (const route of routes) {
    if (typeof route.path !== "string") {
      // eslint-disable-next-line no-console
      console.error("Invalid route with invalid path:", route);
      throw new Error(
        `Invalid route with invalid type of path: ${typeof route.path}`
      );
    }
    const routePath = route.path.replace(
      /^\$\{APP.homepage\}/,
      runtimeContext.app.homepage
    );
    const match = matchPath(runtimeContext.location.pathname, {
      path: routePath,
      exact: route.exact,
    });
    if (match && (await checkIf(route, runtimeContext))) {
      if (
        runtimeContext.app.noAuthGuard ||
        route.public /* || isLoggedIn() */
      ) {
        return { match, route };
      }
      return "unauthenticated";
    }
  }
  return "missed";
}

async function preCheckPermissionsForBrickOrRoute(
  container: BrickConf | RouteConf,
  runtimeContext: RuntimeContext
) {
  if (
    // isLoggedIn() &&
    // !getAuth().isAdmin &&
    Array.isArray(container.permissionsPreCheck)
  ) {
    const actions = (await computeRealValue(
      container.permissionsPreCheck,
      runtimeContext
    )) as string[];
    return validatePermissions(actions);
  }
}
