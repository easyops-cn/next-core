import {
  Storyboard,
  BrickConf,
  RouteConf,
  ProviderConf
} from "@easyops/brick-types";

export function scanBricksInBrickConf(
  brickConf: BrickConf,
  collection: Set<string>
): void {
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
  if (Array.isArray(brickConf.internalUsedBricks)) {
    brickConf.internalUsedBricks.forEach(brick => {
      collection.add(brick);
    });
  }
}

function scanBricksInBrickConfs(
  bricks: BrickConf[],
  collection: Set<string>
): void {
  if (Array.isArray(bricks)) {
    bricks.forEach(brickConf => {
      scanBricksInBrickConf(brickConf, collection);
    });
  }
}

function scanBricksInProviderConfs(
  providers: ProviderConf[],
  collection: Set<string>
): void {
  if (Array.isArray(providers)) {
    providers.forEach(providerConf => {
      collection.add(
        typeof providerConf === "string" ? providerConf : providerConf.brick
      );
    });
  }
}

function scanBricksInRouteConfs(
  routes: RouteConf[],
  collection: Set<string>
): void {
  if (Array.isArray(routes)) {
    routes.forEach(routeConf => {
      scanBricksInProviderConfs(routeConf.providers, collection);
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
