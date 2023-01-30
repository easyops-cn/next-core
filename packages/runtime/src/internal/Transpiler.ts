import type {
  BrickConf,
  BrickPackage,
  MicroApp,
  PluginHistoryState,
  RouteConf,
} from "@next-core/brick-types";
import { enqueueStableLoadBricks } from "@next-core/loader";

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
  type?: string;
  children?: RuntimeBrick;
  properties?: Record<string, unknown>;
}

export async function transpileRoutes(
  routes: RouteConf[],
  app: MicroApp,
  brickPackages: BrickPackage[]
): Promise<TranspileOutput> {
  const matched = matchRoutes(routes, app);
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
          const newOutput = await transpileBricks(route.bricks, brickPackages);
          mergeTranspileOutput(output, newOutput);
        }
      }
    }
  }
  return output;
}

export function mergeTranspileOutput(
  output: TranspileOutput,
  newOutput: TranspileOutput
): void {
  const { main, portal, pendingPromises, ...rest } = newOutput;
  output.main.push(...main);
  output.portal.push(...portal);
  output.pendingPromises.push(...pendingPromises);
  Object.assign(output, rest);
}

export async function transpileBricks(
  bricks: BrickConf[],
  brickPackages: BrickPackage[]
): Promise<TranspileOutput> {
  const output: TranspileOutput = {
    main: [],
    portal: [],
    pendingPromises: [],
  };
  const transpiled = await Promise.all(
    bricks.map((brickConf) => transpileBrick(brickConf, brickPackages))
  );
  for (const item of transpiled) {
    mergeTranspileOutput(output, item);
  }
  return output;
}

export async function transpileBrick(
  brickConf: BrickConf,
  brickPackages: BrickPackage[]
): Promise<TranspileOutput> {
  const output: TranspileOutput = {
    main: [],
    portal: [],
    pendingPromises: [],
  };

  // checkResolvableIf(brickConf, context);

  // const tplTagName = getTagNameOfCustomTemplate(
  //   brickConf.brick,
  //   this.kernel.nextApp?.id
  // );

  const brick: RuntimeBrick = {};

  Object.assign(brick, {
    type: brickConf.brick,
    properties: brickConf.properties,
  });

  if (typeof brickConf.brick === "string" && brickConf.brick.includes(".")) {
    output.pendingPromises.push(
      enqueueStableLoadBricks([brickConf.brick], brickPackages)
    );
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
