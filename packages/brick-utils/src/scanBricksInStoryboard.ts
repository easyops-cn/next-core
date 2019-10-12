import { Storyboard, BrickConf, RouteConf } from "@easyops/brick-types";

function scanBricksInBrickConfs(
  bricks: BrickConf[],
  collection: Set<string>
): void {
  if (Array.isArray(bricks)) {
    bricks.forEach(brickConf => {
      if (brickConf.brick) {
        collection.add(brickConf.brick);
      }
      if (brickConf.slots) {
        Object.values(brickConf.slots).forEach(slotConf => {
          if (slotConf.type === "bricks") {
            scanBricksInBrickConfs(slotConf.bricks, collection);
          } else {
            scanBricksInRouteConfs(slotConf.routes, collection);
          }
        });
      }
    });
  }
}

function scanBricksInRouteConfs(
  routes: RouteConf[],
  collection: Set<string>
): void {
  if (Array.isArray(routes)) {
    routes.forEach(routeConf => {
      scanBricksInBrickConfs(routeConf.bricks, collection);
      if (
        routeConf.menu &&
        routeConf.menu.type === "brick" &&
        routeConf.menu.brick
      ) {
        collection.add(routeConf.menu.brick);
      }
    });
  }
}

export function scanBricksInStoryboard(storyboard: Storyboard): string[] {
  const collection = new Set<string>();
  scanBricksInRouteConfs(storyboard.routes, collection);
  return Array.from(collection);
}
