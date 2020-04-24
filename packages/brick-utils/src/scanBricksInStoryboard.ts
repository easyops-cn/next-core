import {
  Storyboard,
  BrickConf,
  RouteConf,
  ProviderConf,
  RouteConfOfBricks,
  CustomTemplate,
  UseSingleBrickConf,
} from "@easyops/brick-types";
import { uniq } from "lodash";
import { isObject } from "./isObject";

export function scanBricksInStoryboard(
  storyboard: Storyboard,
  isUniq = true
): string[] {
  const collection: string[] = [];
  const selfDefined = new Set<string>();
  collectBricksInRouteConfs(storyboard.routes, collection);
  collectBricksInCustomTemplates(
    storyboard.meta?.customTemplates,
    collection,
    selfDefined
  );
  // Ignore non-custom-elements and self-defined custom templates.
  const result = collection.filter(
    (item) => item.includes("-") && !selfDefined.has(item)
  );
  return isUniq ? uniq(result) : result;
}

export function scanBricksInBrickConf(
  brickConf: BrickConf,
  isUniq = true
): string[] {
  const collection: string[] = [];
  collectBricksInBrickConf(brickConf, collection);
  const result = collection.filter((item) => item.includes("-"));
  return isUniq ? uniq(result) : result;
}

function collectBricksInBrickConf(
  brickConf: BrickConf,
  collection: string[]
): void {
  if (brickConf.brick) {
    collection.push(brickConf.brick);
  }
  if (brickConf.slots) {
    Object.values(brickConf.slots).forEach((slotConf) => {
      if (slotConf.type === "bricks") {
        collectBricksInBrickConfs(slotConf.bricks, collection);
      } else {
        collectBricksInRouteConfs(slotConf.routes, collection);
      }
    });
  }
  if (Array.isArray(brickConf.internalUsedBricks)) {
    brickConf.internalUsedBricks.forEach((brick) => {
      collection.push(brick);
    });
  }
  collectUsedBricksInProperties(brickConf.properties, collection);
}

function collectUsedBricksInProperties(value: any, collection: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item) => {
      collectUsedBricksInProperties(item, collection);
    });
  } else if (isObject(value)) {
    if (value.useBrick) {
      [].concat(value.useBrick).forEach((useBrickConf: UseSingleBrickConf) => {
        if (typeof useBrickConf?.brick === "string") {
          collection.push(useBrickConf.brick);
          collectUsedBricksInProperties(useBrickConf.properties, collection);
        }
      });
    } else {
      Object.values(value).forEach((item) => {
        collectUsedBricksInProperties(item, collection);
      });
    }
  }
}

function collectBricksInBrickConfs(
  bricks: BrickConf[],
  collection: string[]
): void {
  if (Array.isArray(bricks)) {
    bricks.forEach((brickConf) => {
      collectBricksInBrickConf(brickConf, collection);
    });
  }
}

function scanBricksInProviderConfs(
  providers: ProviderConf[],
  collection: string[]
): void {
  if (Array.isArray(providers)) {
    providers.forEach((providerConf) => {
      collection.push(
        typeof providerConf === "string" ? providerConf : providerConf.brick
      );
    });
  }
}

function collectBricksInRouteConfs(
  routes: RouteConf[],
  collection: string[]
): void {
  if (Array.isArray(routes)) {
    routes.forEach((routeConf) => {
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
        collection.push(routeConf.menu.brick);
      }
    });
  }
}

function collectBricksInCustomTemplates(
  customTemplates: CustomTemplate[],
  collection: string[],
  selfDefined: Set<string>
): void {
  if (Array.isArray(customTemplates)) {
    customTemplates.forEach((tpl) => {
      selfDefined.add(tpl.name);
      collectBricksInBrickConfs(tpl.bricks, collection);
    });
  }
}
