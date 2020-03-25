import {
  Storyboard,
  BrickConf,
  RouteConf,
  ProviderConf,
  RouteConfOfBricks,
  CustomTemplate
} from "@easyops/brick-types";

export function scanBricksInStoryboard(storyboard: Storyboard): string[] {
  const collection = new Set<string>();
  const selfDefined = new Set<string>();
  collectBricksInRouteConfs(storyboard.routes, collection);
  collectBricksInCustomTemplates(
    storyboard.meta?.customTemplates,
    collection,
    selfDefined
  );
  // Ignore non-custom-elements and self-defined custom templates.
  return Array.from(collection).filter(
    item => item.includes("-") && !selfDefined.has(item)
  );
}

export function scanBricksInBrickConf(brickConf: BrickConf): string[] {
  const collection = new Set<string>();
  collectBricksInBrickConf(brickConf, collection);
  // Ignore non-custom-elements.
  return Array.from(collection).filter(item => item.includes("-"));
}

function collectBricksInBrickConf(
  brickConf: BrickConf,
  collection: Set<string>
): void {
  if (brickConf.brick) {
    collection.add(brickConf.brick);
  }
  if (brickConf.slots) {
    Object.values(brickConf.slots).forEach(slotConf => {
      if (slotConf.type === "bricks") {
        collectBricksInBrickConfs(slotConf.bricks, collection);
      } else {
        collectBricksInRouteConfs(slotConf.routes, collection);
      }
    });
  }
  if (Array.isArray(brickConf.internalUsedBricks)) {
    brickConf.internalUsedBricks.forEach(brick => {
      collection.add(brick);
    });
  }
}

function collectBricksInBrickConfs(
  bricks: BrickConf[],
  collection: Set<string>
): void {
  if (Array.isArray(bricks)) {
    bricks.forEach(brickConf => {
      collectBricksInBrickConf(brickConf, collection);
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

function collectBricksInRouteConfs(
  routes: RouteConf[],
  collection: Set<string>
): void {
  if (Array.isArray(routes)) {
    routes.forEach(routeConf => {
      scanBricksInProviderConfs(routeConf.providers, collection);
      if (routeConf.type === "routes") {
        collectBricksInRouteConfs(routeConf.routes, collection);
      } else {
        collectBricksInBrickConfs(
          (routeConf as RouteConfOfBricks).bricks,
          collection
        );
      }
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

function collectBricksInCustomTemplates(
  customTemplates: CustomTemplate[],
  collection: Set<string>,
  selfDefined: Set<string>
): void {
  if (Array.isArray(customTemplates)) {
    customTemplates.forEach(tpl => {
      selfDefined.add(tpl.name);
      collectBricksInBrickConfs(tpl.bricks, collection);
    });
  }
}
