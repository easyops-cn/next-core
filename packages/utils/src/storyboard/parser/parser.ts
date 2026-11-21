import type {
  BrickConf,
  BrickEventHandler,
  BrickEventHandlerCallback,
  BrickEventsMap,
  BrickLifeCycle,
  ConditionalEventHandler,
  ContextConf,
  CustomTemplate,
  CustomTemplateConstructor,
  MenuConf,
  MessageConf,
  ResolveConf,
  ResolveMenuConf,
  RouteConf,
  RouteConfOfBricks,
  RouteConfOfRedirect,
  ScrollIntoViewConf,
  SlotConfOfBricks,
  SlotsConf,
  Storyboard,
  UseProviderEventHandler,
  UseSingleBrickConf,
} from "@next-core/types";
import { hasOwnProperty, isObject } from "@next-core/utils/general";
import type {
  LegacyProviderConf,
  LegacyRouteConf,
  MenuItemRawData,
  MenuRawData,
  StoryboardNodeBrick,
  StoryboardNodeCondition,
  StoryboardNodeConditionalEvent,
  StoryboardNodeContext,
  StoryboardNodeEvent,
  StoryboardNodeEventCallback,
  StoryboardNodeEventHandler,
  StoryboardNodeLifeCycle,
  StoryboardNodeMenu,
  StoryboardNodeMetaMenu,
  StoryboardNodeMetaMenuItem,
  StoryboardNodeResolvable,
  StoryboardNodeRoot,
  StoryboardNodeRoute,
  StoryboardNodeSlot,
  StoryboardNodeTemplate,
  StoryboardNodeUseBackendEntry,
  StoryboardNodeUseBrickEntry,
} from "./interfaces.js";

export interface ParseOptions {
  legacy?: boolean;
  isUseBrick?: boolean;
}

/** Parse storyboard as AST. */
export function parseStoryboard(
  storyboard: Storyboard,
  options?: ParseOptions
): StoryboardNodeRoot {
  return {
    type: "Root",
    raw: storyboard,
    routes: parseRoutes(storyboard.routes, options),
    templates: parseTemplates(storyboard.meta?.customTemplates, options),
    menus: parseMetaMenus(storyboard.meta?.menus),
  };
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
      context: parseContext(route.context),
      redirect:
        options?.legacy || route.type === "redirect"
          ? parseResolvable(
              (route as RouteConfOfRedirect).redirect as ResolveConf
            )
          : undefined,
      menu: parseMenu(route.menu, options),
      providers: options?.legacy
        ? parseRouteProviders((route as LegacyRouteConf).providers)
        : undefined,
      defineResolves:
        options?.legacy &&
        Array.isArray((route as LegacyRouteConf).defineResolves)
          ? ((route as LegacyRouteConf)
              .defineResolves!.map((item) => parseResolvable(item))
              .filter(Boolean) as StoryboardNodeResolvable[])
          : undefined,
      children:
        route.type === "routes"
          ? parseRoutes(route.routes, options)
          : options?.legacy || route.type !== "redirect"
            ? parseBricks((route as RouteConfOfBricks).bricks, options)
            : [],
    }));
  }
  return [];
}

/** Parse storyboard templates as AST. */
export function parseTemplates(
  templates: (CustomTemplate | CustomTemplateConstructor)[] | undefined,
  options?: ParseOptions
): StoryboardNodeTemplate[] {
  if (Array.isArray(templates)) {
    return templates.map<StoryboardNodeTemplate>((tpl) =>
      parseTemplate(tpl, options)
    );
  }
  return [];
}

/** Parse a storyboard template as AST. */
export function parseTemplate(
  tpl: CustomTemplate | CustomTemplateConstructor,
  options?: ParseOptions
): StoryboardNodeTemplate {
  return {
    type: "Template",
    raw: tpl,
    bricks: parseBricks(tpl.bricks, options),
    context: parseContext(tpl.state),
  };
}

export function parseBricks(
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
    if: parseCondition(brick),
    events: parseEvents(brick.events),
    lifeCycle: parseLifeCycles(brick.lifeCycle, options),
    ...parseBrickProperties(brick.properties, options),
    context: parseContext(
      (brick as BrickConf & { context?: ContextConf[] }).context
    ),
    children: parseSlots(
      childrenToSlots(
        (brick as { children?: BrickConf[] }).children,
        brick.slots as SlotsConf
      ),
      options
    ),
  } as StoryboardNodeBrick;
}

function parseCondition(
  conditionContainer: Pick<BrickConf, "if">
): StoryboardNodeCondition | undefined {
  if (hasOwnProperty(conditionContainer, "if")) {
    const condition = conditionContainer.if;
    if (isObject(condition)) {
      return {
        type: "ResolvableCondition",
        resolve: parseResolvable(condition as ResolveConf),
      };
    }
    return {
      type: "LiteralCondition",
    };
  }
}

function parseBrickProperties(
  props: unknown,
  options?: ParseOptions
): {
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
              ([] as UseSingleBrickConf[]).concat(
                value.useBrick as UseSingleBrickConf
              ),
              {
                ...options,
                isUseBrick: true,
              }
            ),
          });
        }
        const provider = (value.useBackend as { provider?: string } | undefined)
          ?.provider;
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

export function parseLifeCycles(
  lifeCycle: BrickLifeCycle | undefined,
  options?: ParseOptions
): StoryboardNodeLifeCycle[] | undefined {
  if (isObject(lifeCycle)) {
    return Object.entries(
      lifeCycle as BrickLifeCycle
    ).map<StoryboardNodeLifeCycle>(([name, conf]) => {
      switch (name) {
        case "onPageLoad":
        case "onPageLeave":
        case "onAnchorLoad":
        case "onAnchorUnload":
        case "onMessageClose":
        case "onBeforePageLoad":
        case "onBeforePageLeave":
        case "onMount":
        case "onUnmount":
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
          if (name === "useResolves" && options?.legacy) {
            return {
              type: "ResolveLifeCycle",
              rawContainer: lifeCycle,
              rawKey: name,
              resolves: (conf as ResolveConf[] | undefined)?.map(
                (item) => parseResolvable(item, true)!
              ),
            };
          }
          return {
            type: "UnknownLifeCycle",
            rawContainer: lifeCycle,
            rawKey: name,
          };
      }
    });
  }
}

function childrenToSlots(
  children: BrickConf[] | undefined,
  originalSlots: SlotsConf | undefined
): SlotsConf | undefined {
  let newSlots = originalSlots;
  // istanbul ignore next
  if (
    process.env.NODE_ENV === "development" &&
    children &&
    !Array.isArray(children)
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "Specified brick children but not array:",
      `<${typeof children}>`,
      children
    );
  }
  if (Array.isArray(children) && !newSlots) {
    newSlots = {};
    for (const child of children) {
      const slot = (child as { slot?: string }).slot ?? "";
      if (!Object.prototype.hasOwnProperty.call(newSlots, slot)) {
        newSlots[slot] = {
          type: "bricks",
          bricks: [],
        };
      }
      (newSlots[slot] as SlotConfOfBricks).bricks.push(child);
    }
  }
  return newSlots;
}

function parseSlots(
  slots: SlotsConf | undefined,
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

export function parseEvents(
  events: BrickEventsMap | undefined
): StoryboardNodeEvent[] | undefined {
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
  contexts: ContextConf /* | CustomTemplateState */[] | undefined
): StoryboardNodeContext[] | undefined {
  if (Array.isArray(contexts)) {
    return contexts.map<StoryboardNodeContext>((context) => ({
      type: "Context",
      raw: context,
      resolve: parseResolvable(context.resolve),
      onChange: parseEventHandlers(context.onChange),
    }));
  }
}

export function parseMenu(
  menu: MenuConf | undefined,
  options?: ParseOptions
): StoryboardNodeMenu | undefined {
  if (menu === false) {
    return { type: "FalseMenu" };
  }
  if (!menu) {
    return;
  }
  switch (menu.type as "brick" | "resolve" | "static") {
    case "brick":
      return options?.legacy
        ? {
            type: "BrickMenu",
            raw: menu,
            brick: parseBrick(menu as unknown as BrickConf),
          }
        : undefined;
    case "resolve":
      return {
        type: "ResolvableMenu",
        resolve: parseResolvable((menu as ResolveMenuConf).resolve),
      };
    default:
      return {
        type: "StaticMenu",
      };
  }
}

function parseResolvable(
  resolve: ResolveConf | undefined,
  isConditional?: boolean
): StoryboardNodeResolvable | undefined {
  if (isObject(resolve)) {
    return {
      type: "Resolvable",
      raw: resolve,
      isConditional,
    };
  }
}

function parseEventHandlers(
  handlers: BrickEventHandler | BrickEventHandler[] | undefined
): StoryboardNodeEventHandler[] {
  return ([] as BrickEventHandler[])
    .concat(handlers ?? [])
    .map<StoryboardNodeEventHandler>((handler, index) => ({
      type: "EventHandler",
      callback: parseEventCallback(
        (handler as UseProviderEventHandler).callback
      ),
      then: parseEventHandlers((handler as ConditionalEventHandler).then),
      else: parseEventHandlers((handler as ConditionalEventHandler).else),
      raw: handler,
      rawKey: Array.isArray(handlers) ? index : undefined,
    }));
}

function parseEventCallback(
  callback: BrickEventHandlerCallback | undefined
): StoryboardNodeEventCallback[] | undefined {
  if (isObject(callback)) {
    return Object.entries(callback).map<StoryboardNodeEventCallback>(
      ([callbackType, handlers]) => ({
        type: "EventCallback",
        rawContainer: callback as BrickEventsMap,
        rawKey: callbackType,
        handlers: parseEventHandlers(handlers as BrickEventHandler),
      })
    );
  }
}

function parseRouteProviders(
  providers: LegacyProviderConf[] | undefined
): StoryboardNodeBrick[] | undefined {
  if (Array.isArray(providers)) {
    return providers.map<StoryboardNodeBrick>((provider) =>
      parseBrick(typeof provider === "string" ? { brick: provider } : provider)
    );
  }
}

export function parseMetaMenus(
  menus: MenuRawData[] | undefined
): StoryboardNodeMetaMenu[] {
  if (Array.isArray(menus)) {
    return menus.map<StoryboardNodeMetaMenu>(parseMetaMenu);
  }
  return [];
}

function parseMetaMenu(menu: MenuRawData): StoryboardNodeMetaMenu {
  return {
    type: "MetaMenu",
    raw: menu,
    items: parseMetaItems(menu.items),
  };
}

function parseMetaItems(
  menuItems: MenuItemRawData[] | undefined
): StoryboardNodeMetaMenuItem[] {
  if (Array.isArray(menuItems)) {
    return menuItems.map<StoryboardNodeMetaMenuItem>(parseMetaItem);
  }
  return [];
}

function parseMetaItem(menuItem: MenuItemRawData): StoryboardNodeMetaMenuItem {
  return {
    type: "MetaMenuItem",
    raw: menuItem,
    children: parseMetaItems(menuItem.children),
  };
}
