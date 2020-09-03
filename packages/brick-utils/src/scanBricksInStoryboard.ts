import {
  Storyboard,
  BrickConf,
  RouteConf,
  ProviderConf,
  RouteConfOfBricks,
  CustomTemplate,
  UseSingleBrickConf,
  UseProviderResolveConf,
  UseProviderEventHandler,
  BrickEventsMap,
  ContextConf,
  ResolveConf,
  MessageConf,
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
  // Ignore non-custom-elements and self-defined custom templates and custom api providers.
  const result = collection.filter(
    (item) =>
      !item.includes("@") && item.includes("-") && !selfDefined.has(item)
  );
  return isUniq ? uniq(result) : result;
}

export function scanBricksInBrickConf(
  brickConf: BrickConf,
  isUniq = true
): string[] {
  const collection: string[] = [];
  collectBricksInBrickConf(brickConf, collection);
  const result = collection.filter(
    (item) => !item.includes("@") && item.includes("-")
  );
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
  if (brickConf.lifeCycle) {
    const {
      useResolves,
      onPageLoad,
      onPageLeave,
      onAnchorLoad,
      onAnchorUnload,
      onMessage,
    } = brickConf.lifeCycle;
    if (Array.isArray(useResolves)) {
      useResolves.forEach((useResolve) => {
        const useProvider = (useResolve as UseProviderResolveConf).useProvider;
        if (useProvider) {
          collection.push(useProvider);
        }
      });
    }

    const messageLifeCycleHandlers = ([] as MessageConf[])
      .concat(onMessage)
      .filter(Boolean)
      .reduce(
        (previousValue, currentValue) =>
          previousValue.concat(currentValue.handlers),
        []
      );

    collectUsedBricksInEventHandlers(
      {
        onPageLoad,
        onPageLeave,
        onAnchorLoad,
        onAnchorUnload,
        onMessage: messageLifeCycleHandlers,
      },
      collection
    );
  }
  collectUsedBricksInEventHandlers(brickConf.events, collection);
  collectBricksInResolvable(brickConf.if as ResolveConf, collection);
  collectBricksInContext(brickConf.context, collection);
  collectUsedBricksInProperties(brickConf.properties, collection);
}

function collectBricksInResolvable(
  resolvable: ResolveConf,
  collection: string[]
): void {
  if (
    isObject(resolvable) &&
    (resolvable as UseProviderResolveConf).useProvider
  ) {
    collection.push((resolvable as UseProviderResolveConf).useProvider);
  }
}

function collectBricksInContext(
  context: ContextConf[],
  collection: string[]
): void {
  if (Array.isArray(context)) {
    for (const ctx of context) {
      collectBricksInResolvable(ctx.resolve, collection);
    }
  }
}

function collectUsedBricksInEventHandlers(
  events: BrickEventsMap,
  collection: string[]
): void {
  if (isObject(events)) {
    Object.values(events)
      .filter(Boolean)
      .forEach((handlers) => {
        [].concat(handlers).forEach((handler: UseProviderEventHandler) => {
          if (handler.useProvider) {
            collection.push(handler.useProvider);
          }
          if (handler.callback) {
            collectUsedBricksInEventHandlers(
              handler.callback as BrickEventsMap,
              collection
            );
          }
        });
      });
  }
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
          collectUsedBricksInEventHandlers(useBrickConf.events, collection);
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
      collectBricksInContext(routeConf.context, collection);
      collectBricksInResolvable(routeConf.redirect as ResolveConf, collection);
      if (Array.isArray(routeConf.defineResolves)) {
        for (const def of routeConf.defineResolves) {
          collectBricksInResolvable(def, collection);
        }
      }
      if (routeConf.type === "routes") {
        collectBricksInRouteConfs(routeConf.routes, collection);
      } else {
        collectBricksInBrickConfs(
          (routeConf as RouteConfOfBricks).bricks,
          collection
        );
      }
      if (routeConf.menu) {
        if (routeConf.menu.type === "brick" && routeConf.menu.brick) {
          collection.push(routeConf.menu.brick);
        } else if (routeConf.menu.type === "resolve") {
          collectBricksInResolvable(routeConf.menu.resolve, collection);
        }
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
