import type { LegacyCompatibleRuntimeContext } from "@next-core/inject";

type RouteMatched = LegacyCompatibleRuntimeContext["match"];

const routeMatchedMap = new Map<string, RouteMatched>();

export function setMatchedRoute(id: string, match: RouteMatched): void {
  routeMatchedMap.set(id, match);
}

export function getMatchedRoute(id: string): RouteMatched {
  return routeMatchedMap.get(id);
}

export function clearMatchedRoutes(): void {
  return routeMatchedMap.clear();
}
