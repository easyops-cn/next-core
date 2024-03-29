import type { RouteConf } from "@next-core/types";
import { MatchResult, matchPath } from "./matchPath.js";
import { asyncCheckIf } from "./compute/checkIf.js";
import type { RuntimeContext } from "./interfaces.js";
import { hooks } from "./Runtime.js";

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
  const routePath = route.path.replace(/^\$\{APP.homepage\}/, homepage);
  return matchPath(pathname, {
    path: routePath,
    exact: route.exact,
  });
}
