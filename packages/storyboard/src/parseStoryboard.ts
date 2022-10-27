import type {
  BrickConf,
  BrickEventHandler,
  BrickEventHandlerCallback,
  BrickEventsMap,
  BrickLifeCycle,
  ContextConf,
  CustomTemplate,
  CustomTemplateConstructor,
  CustomTemplateState,
  MenuConf,
  MessageConf,
  ProviderConf,
  ResolveConf,
  RouteConf,
  RouteConfOfBricks,
  ScrollIntoViewConf,
  SlotsConf,
  Storyboard,
  UseProviderEventHandler,
  UseSingleBrickConf,
} from "@next-core/brick-types";
import type {
  StoryboardNodeBrick,
  StoryboardNodeCondition,
  StoryboardNodeConditionalEvent,
  StoryboardNodeContext,
  StoryboardNodeEvent,
  StoryboardNodeEventCallback,
  StoryboardNodeEventHandler,
  StoryboardNodeLifeCycle,
  StoryboardNodeMenu,
  StoryboardNodeResolvable,
  StoryboardNodeRoot,
  StoryboardNodeRoute,
  StoryboardNodeSlot,
  StoryboardNodeTemplate,
  StoryboardNodeUseBackendEntry,
  StoryboardNodeUseBrickEntry,
} from "./interfaces";

/** Parse storyboard as AST. */
export function parseStoryboard(storyboard: Storyboard): StoryboardNodeRoot {
  return {
    type: "Root",
    raw: storyboard,
    routes: parseRoutes(storyboard.routes),
    templates: parseTemplates(storyboard.meta?.customTemplates),
  };
}

export interface ParseOptions {
  routesOnly?: boolean;
  isUseBrick?: boolean;
}

/** Parse storyboard routes as AST. */
export function parseRoutes(
  routes: RouteConf[],
  options?: ParseOptions
): StoryboardNodeRoute[] {
  if (Array.isArray(routes)) {
    return routes.map<StoryboardNodeRoute>((route) => ({
      type: "Route",
      raw: route,
      ...(options?.routesOnly
        ? null
        : {
            context: parseContext(route.context),
            redirect: parseResolvable(route.redirect as ResolveConf),
            menu: parseMenu(route.menu),
            providers: parseRouteProviders(route.providers),
            defineResolves: Array.isArray(route.defineResolves)
              ? route.defineResolves
                  .map((item) => parseResolvable(item))
                  .filter(Boolean)
              : undefined,
          }),
      children:
        route.type === "routes"
          ? parseRoutes(route.routes, options)
          : parseBricks((route as RouteConfOfBricks).bricks, options),
    }));
  }
  return [];
}

/** Parse storyboard templates as AST. */
export function parseTemplates(
  templates: (CustomTemplate | CustomTemplateConstructor)[]
): StoryboardNodeTemplate[] {
  if (Array.isArray(templates)) {
    return templates.map<StoryboardNodeTemplate>(parseTemplate);
  }
  return [];
}

/** Parse a storyboard template as AST. */
export function parseTemplate(
  tpl: CustomTemplate | CustomTemplateConstructor
): StoryboardNodeTemplate {
  return {
    type: "Template",
    raw: tpl,
    bricks: parseBricks(tpl.bricks),
    context: parseContext(tpl.state),
  };
}

function parseBricks(
  bricks: BrickConf[] | UseSingleBrickConf[],
  options?: ParseOptions
): StoryboardNodeBrick[] {
  if (Array.isArray(bricks)) {
    return bricks.map((brick) => parseBrick(brick, options));
  }
  return [];
}

/** Parse a storyboard brick as AST. */
export function parseBrick(
  brick: BrickConf | UseSingleBrickConf,
  options?: ParseOptions
): StoryboardNodeBrick {
  return {
    type: "Brick",
    raw: brick,
    isUseBrick: options?.isUseBrick,
    ...(options?.routesOnly
      ? null
      : {
          if: parseCondition(brick.if),
          events: parseEvents(brick.events),
          lifeCycle: parseLifeCycles(brick.lifeCycle),
          ...parseBrickProperties(brick.properties),
          context: parseContext((brick as BrickConf).context),
        }),
    children: parseSlots(brick.slots as SlotsConf, options),
  } as StoryboardNodeBrick;
}

function parseCondition(condition: BrickConf["if"]): StoryboardNodeCondition {
  if (isObject(condition)) {
    return {
      type: "ResolvableCondition",
      resolve: parseResolvable(condition),
    };
  }
  return {
    type: "LiteralCondition",
  };
}

function parseBrickProperties(props: unknown): {
  useBrick?: StoryboardNodeUseBrickEntry[];
  useBackend?: StoryboardNodeUseBackendEntry[];
} {
  const useBrick: StoryboardNodeUseBrickEntry[] = [];
  const useBackend: StoryboardNodeUseBackendEntry[] = [];

  function walkBrickProperties(value: unknown): void {
    if (Array.isArray(value)) {
      for (const item of value) {
        walkBrickProperties(item);
      }
    } else if (isObject(value)) {
      if (value.useBrick || value.useBackend) {
        if (value.useBrick) {
          useBrick.push({
            type: "UseBrickEntry",
            rawContainer: value,
            rawKey: "useBrick",
            children: parseBricks(
              ([] as UseSingleBrickConf[]).concat(value.useBrick),
              {
                isUseBrick: true,
              }
            ),
          });
        }
        const provider = value.useBackend?.provider;
        if (typeof provider === "string") {
          useBackend.push({
            type: "UseBackendEntry",
            rawContainer: value,
            rawKey: "useBackend",
            children: [parseBrick({ brick: provider })],
          });
        }
      } else {
        for (const item of Object.values(value)) {
          walkBrickProperties(item);
        }
      }
    }
  }

  walkBrickProperties(props);

  return { useBrick, useBackend };
}

function parseLifeCycles(lifeCycle: BrickLifeCycle): StoryboardNodeLifeCycle[] {
  if (isObject(lifeCycle)) {
    return Object.entries(lifeCycle).map<StoryboardNodeLifeCycle>(
      ([name, conf]) => {
        switch (name) {
          case "useResolves":
            return {
              type: "ResolveLifeCycle",
              rawContainer: lifeCycle,
              rawKey: name,
              resolves: Array.isArray(conf)
                ? conf
                    .map((item) => parseResolvable(item, true))
                    .filter(Boolean)
                : undefined,
            };
          case "onPageLoad":
          case "onPageLeave":
          case "onAnchorLoad":
          case "onAnchorUnload":
          case "onMessageClose":
          case "onBeforePageLoad":
          case "onBeforePageLeave":
          case "onMediaChange":
            return {
              type: "SimpleLifeCycle",
              name,
              rawContainer: lifeCycle,
              rawKey: name,
              handlers: parseEventHandlers(conf),
            };
          case "onMessage":
          case "onScrollIntoView":
            return {
              type: "ConditionalLifeCycle",
              name,
              events: ([] as (MessageConf | ScrollIntoViewConf)[])
                .concat(conf)
                .filter(Boolean)
                .map<StoryboardNodeConditionalEvent>((item) => ({
                  type: "ConditionalEvent",
                  rawContainer: item,
                  rawKey: "handlers",
                  handlers: parseEventHandlers(item.handlers),
                })),
            };
          default:
            return { type: "UnknownLifeCycle" };
        }
      }
    );
  }
}

function parseSlots(
  slots: SlotsConf,
  options?: ParseOptions
): StoryboardNodeSlot[] {
  if (isObject(slots)) {
    return Object.entries(slots).map<StoryboardNodeSlot>(([slot, conf]) => ({
      type: "Slot",
      raw: conf,
      slot,
      childrenType: conf.type === "routes" ? "Route" : "Brick",
      children:
        conf.type === "routes"
          ? parseRoutes(conf.routes, options)
          : parseBricks(conf.bricks, options),
    }));
  }
  return [];
}

function parseEvents(events: BrickEventsMap): StoryboardNodeEvent[] {
  if (isObject(events)) {
    return Object.entries(events).map<StoryboardNodeEvent>(
      ([eventType, handlers]) => ({
        type: "Event",
        rawContainer: events,
        rawKey: eventType,
        handlers: parseEventHandlers(handlers),
      })
    );
  }
}

function parseContext(
  contexts: (ContextConf | CustomTemplateState)[]
): StoryboardNodeContext[] {
  if (Array.isArray(contexts)) {
    return contexts.map<StoryboardNodeContext>((context) => ({
      type: "Context",
      raw: context,
      resolve: parseResolvable(context.resolve),
      onChange: parseEventHandlers(context.onChange),
    }));
  }
}

function parseMenu(menu: MenuConf): StoryboardNodeMenu {
  if (menu === false) {
    return { type: "FalseMenu" };
  }
  if (!menu) {
    return;
  }
  switch (menu.type) {
    case "brick":
      return {
        type: "BrickMenu",
        raw: menu,
        brick: parseBrick(menu),
      };
    case "resolve":
      return {
        type: "ResolvableMenu",
        resolve: parseResolvable(menu.resolve),
      };
    default:
      return {
        type: "StaticMenu",
      };
  }
}

function parseResolvable(
  resolve: ResolveConf,
  isConditional?: boolean
): StoryboardNodeResolvable {
  if (isObject(resolve)) {
    return {
      type: "Resolvable",
      raw: resolve,
      isConditional,
    };
  }
}

function parseEventHandlers(
  handlers: BrickEventHandler | BrickEventHandler[]
): StoryboardNodeEventHandler[] {
  return ([] as BrickEventHandler[])
    .concat(handlers)
    .filter(Boolean)
    .map<StoryboardNodeEventHandler>((handler) => ({
      type: "EventHandler",
      callback: parseEventCallback(
        (handler as UseProviderEventHandler).callback
      ),
      raw: handler,
    }));
}

function parseEventCallback(
  callback: BrickEventHandlerCallback
): StoryboardNodeEventCallback[] {
  if (isObject(callback)) {
    return Object.entries(callback).map<StoryboardNodeEventCallback>(
      ([callbackType, handlers]) => ({
        type: "EventCallback",
        rawContainer: callback as BrickEventsMap,
        rawKey: callbackType,
        handlers: parseEventHandlers(handlers),
      })
    );
  }
}

function parseRouteProviders(
  providers?: ProviderConf[]
): StoryboardNodeBrick[] {
  if (Array.isArray(providers)) {
    return providers.map<StoryboardNodeBrick>((provider) =>
      parseBrick(typeof provider === "string" ? { brick: provider } : provider)
    );
  }
}

// Ref https://github.com/lodash/lodash/blob/4.17.11/lodash.js#L11744
function isObject(value: unknown): value is Record<string, any> {
  const type = typeof value;
  return value != null && (type == "object" || type == "function");
}
