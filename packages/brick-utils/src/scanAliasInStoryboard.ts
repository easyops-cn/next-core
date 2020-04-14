import {
  Storyboard,
  BrickConf,
  RouteConf,
  RouteConfOfBricks,
  RouteAliasMap,
} from "@easyops/brick-types";

export function scanRouteAliasInStoryboard(
  storyboard: Storyboard
): RouteAliasMap {
  const collection: RouteAliasMap = new Map();
  collectRouteAliasInRouteConfs(storyboard.routes, collection);
  return collection;
}

function collectRouteAliasInBrickConf(
  brickConf: BrickConf,
  collection: RouteAliasMap
): void {
  if (brickConf.slots) {
    Object.values(brickConf.slots).forEach((slotConf) => {
      if (slotConf.type === "bricks") {
        collectRouteAliasInBrickConfs(slotConf.bricks, collection);
      } else {
        collectRouteAliasInRouteConfs(slotConf.routes, collection);
      }
    });
  }
}

function collectRouteAliasInBrickConfs(
  bricks: BrickConf[],
  collection: RouteAliasMap
): void {
  if (Array.isArray(bricks)) {
    bricks.forEach((brickConf) => {
      collectRouteAliasInBrickConf(brickConf, collection);
    });
  }
}

function collectRouteAliasInRouteConfs(
  routes: RouteConf[],
  collection: RouteAliasMap
): void {
  if (Array.isArray(routes)) {
    routes.forEach((routeConf) => {
      const alias = routeConf.alias;
      if (alias) {
        if (collection.has(alias)) {
          // eslint-disable-next-line no-console
          console.error(`Duplicated route alias: ${alias}`);
        }
        collection.set(alias, {
          alias,
          path: routeConf.path,
        });
      }
      if (routeConf.type === "routes") {
        collectRouteAliasInRouteConfs(routeConf.routes, collection);
      } else {
        collectRouteAliasInBrickConfs(
          (routeConf as RouteConfOfBricks).bricks,
          collection
        );
      }
    });
  }
}
