import type { RouteConf } from "@next-core/types";
import { MatchResult, matchPath } from "./matchPath.js";
import { asyncCheckIf } from "./compute/checkIf.js";
import { isLoggedIn } from "../auth.js";
import type { RuntimeContext } from "./interfaces.js";

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
    const routePath = route.path.replace(
      /^\$\{APP.homepage\}/,
      runtimeContext.app.homepage
    );
    const match = matchPath(runtimeContext.location.pathname, {
      path: routePath,
      exact: route.exact,
    });
    if (match && (await asyncCheckIf(route, runtimeContext))) {
      if (runtimeContext.app.noAuthGuard || route.public || isLoggedIn()) {
        return { match, route };
      }
      return "unauthenticated";
    }
  }
  return "missed";
}
