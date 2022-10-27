import type { Storyboard, RouteAliasMap } from "@next-core/brick-types";
import { parseRoutes, traverse } from "@next-core/storyboard";

export function scanRouteAliasInStoryboard(
  storyboard: Storyboard
): RouteAliasMap {
  const collection: RouteAliasMap = new Map();
  const routes = parseRoutes(storyboard.routes, { routesOnly: true });

  traverse(routes, (node) => {
    if (node.type === "Route") {
      const alias = node.raw.alias;
      if (alias) {
        if (collection.has(alias)) {
          // eslint-disable-next-line no-console
          console.warn(`Duplicated route alias: ${alias}`);
        }
        collection.set(alias, {
          alias,
          path: node.raw.path,
        });
      }
    }
  });

  return collection;
}
