import type {
  BrickConf,
  BrickPackage,
  MicroApp,
  PluginHistoryState,
  RouteConf,
} from "@next-core/brick-types";
import { enqueueStableLoadBricks } from "@next-core/loader";
import { isObject } from "@next-core/utils/general";
import { computeRealProperties } from "./compute/computeRealProperties.js";
import { evaluate } from "./evaluate.js";
import { RuntimeContext } from "./RuntimeContext.js";

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
  pendingPromises: Promise<unknown>[];
}

export interface RuntimeBrick {
  children: RuntimeBrick[];
  type?: string;
  properties?: Record<string, unknown>;
  slotId?: string;
}

export async function transpileRoutes(
  routes: RouteConf[],
  runtimeContext: RuntimeContext,
  slotId?: string
): Promise<TranspileOutput> {
  const matched = matchRoutes(routes, runtimeContext.app);
  const output: TranspileOutput = {
    main: [],
    portal: [],
    pendingPromises: [],
  };
  switch (matched) {
    case "missed":
      break;
    case "unauthenticated":
      output.unauthenticated = true;
      break;
    default: {
      const route = (output.route = matched.route);
      // defineStoryboardContext(route.context, context);
      // preCheckPermissions(route, context);
      switch (route.type) {
        case "routes": {
          break;
        }
        case "redirect": {
          // const redirect = computeRealValue(route.redirect, context);
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

export function mergeTranspileOutput(
  output: TranspileOutput,
  newOutput: TranspileOutput | undefined
): void {
  if (!newOutput) {
    return;
  }
  const { main, portal, pendingPromises, ...rest } = newOutput;
  output.main.push(...main);
  output.portal.push(...portal);
  output.pendingPromises.push(...pendingPromises);
  Object.assign(output, rest);
}

export async function transpileBricks(
  bricks: BrickConf[],
  runtimeContext: RuntimeContext,
  slotId?: string
): Promise<TranspileOutput> {
  const output: TranspileOutput = {
    main: [],
    portal: [],
    pendingPromises: [],
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
    pendingPromises: [],
  };

  const brick: RuntimeBrick = {
    children: [],
    slotId,
  };

  Object.assign(brick, {
    type: brickConf.brick,
    properties: await computeRealProperties(
      brickConf.properties,
      runtimeContext
    ),
  });

  if (typeof brickConf.brick === "string" && brickConf.brick.includes(".")) {
    output.pendingPromises.push(
      enqueueStableLoadBricks([brickConf.brick], runtimeContext.brickPackages)
    );
  }

  if (brickConf.portal) {
    // A portal brick has no slotId.
    brick.slotId = undefined;
    // Make parent portal bricks appear before child bricks.
    // This makes z-index of a child brick be higher than its parent.
    output.portal.push(brick);
  }

  if (isObject(brickConf.slots)) {
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
  }

  output.main.push(brick);

  return output;
}

function matchRoutes(
  routes: RouteConf[],
  app: MicroApp
):
  | "missed"
  | "unauthenticated"
  | {
      route: RouteConf;
    } {
  return {
    route: routes[0],
  };
}
