import type { RouteConf } from "@next-core/types";
import { MatchResult, matchPath } from "./matchPath.js";
import { asyncCheckIf } from "./compute/checkIf.js";
import type { RuntimeContext } from "./interfaces.js";
import { hooks } from "./Runtime.js";

const HOMEPAGE_PREFIX = "${APP.homepage}";

type MatchRoutesResult =
  | {
      match: MatchResult;
      route: RouteConf;
    }
  | "missed"
  | "unauthenticated";

export async function matchRoutes(
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
    const match = matchRoute(
      route,
      runtimeContext.app.homepage,
      runtimeContext.location.pathname
    );
    if (match && (await asyncCheckIf(route, runtimeContext))) {
      if (
        runtimeContext.app.noAuthGuard ||
        route.public ||
        !hooks?.auth ||
        hooks.auth.isLoggedIn()
      ) {
        return { match, route };
      }
      return "unauthenticated";
    }
  }
  return "missed";
}

export function matchRoute(
  route: RouteConf,
  homepage: string,
  pathname: string
) {
  const path = getRoutePath(route, homepage);
  return matchPath(pathname, {
    path,
    exact: route.exact,
  });
}

function getRoutePath(route: RouteConf, homepage: string): string | string[] {
  if (route.path.startsWith(HOMEPAGE_PREFIX)) {
    const restPath = route.path.slice(HOMEPAGE_PREFIX.length);
    if (
      restPath.startsWith("[") &&
      restPath.endsWith("]") &&
      restPath.includes(",")
    ) {
      const paths = restPath.slice(1, -1).split(",");
      return paths.map((p) => `${homepage}${p}`);
    }
    return `${homepage}${restPath}`;
  }
  return route.path;
}
