import type {
  BrickConf,
  MicroApp,
  PluginHistoryState,
  RouteConf,
} from "@next-core/brick-types";

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
}

export interface RuntimeBrick {
  type?: string;
  children?: RuntimeBrick;
}

export async function transpileRoutes(
  routes: RouteConf[],
  app: MicroApp
): Promise<TranspileOutput> {
  const matched = matchRoutes(routes, app);
  const output: TranspileOutput = {
    main: [],
    portal: [],
  };
  switch (matched) {
    case "missed":
      break;
    case "unauthenticated":
      output.unauthenticated = true;
      break;
    default: {
      const route = (output.route = matched.route);
      // defineStoryboardContext(route.context);
      // preCheckPermissions(route);
      switch (route.type) {
        case "routes": {
          break;
        }
        case "redirect": {
          // const redirect = computeRealValue(route.redirect);
          break;
        }
        default: {
          const newOutput = await transpileBricks(route.bricks);
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
  const { main, portal, ...rest } = newOutput;
  output.main.push(...main);
  output.portal.push(...portal);
  Object.assign(output, rest);
}

export async function transpileBricks(
  bricks: BrickConf[]
): Promise<TranspileOutput> {
  const output: TranspileOutput = {
    main: [],
    portal: [],
  };
  for (const brickConf of bricks) {
    mergeTranspileOutput(output, await transpileBrick(brickConf));
  }
  return output;
}

export async function transpileBrick(
  brickConf: BrickConf
): Promise<TranspileOutput> {
  const output: TranspileOutput = {
    main: [],
    portal: [],
  };
  const brick: RuntimeBrick = {};

  Object.assign(brick, {
    type: brickConf.brick,
    properties: brickConf.properties,
  });

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
