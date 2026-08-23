import type {
  BrickConf,
  BrickEventHandler,
  BrickEventHandlerCallback,
  BrickEventsMap,
  BrickLifeCycle,
  ContextConf,
  CustomTemplate,
  CustomTemplateConstructor,
  MessageConf,
  ResolveConf,
  RouteConf,
  ScrollIntoViewConf,
  SlotConf,
  Storyboard,
  UseSingleBrickConf,
} from "@next-core/types";

export type LegacyBrickMenuConf = unknown;
export type LegacyProviderConf = string | BrickConf;
export type MenuRawData = {
  items?: MenuItemRawData[];
};
export type MenuItemRawData = {
  children?: MenuItemRawData[];
};
export type LegacyBrickConf = BrickConf & {
  context?: ContextConf[];
};
export type LegacyRouteConf = RouteConf & {
  providers?: LegacyProviderConf[];
  defineResolves?: ResolveConf[];
};

export type StoryboardNode =
  | StoryboardNodeRoot
  | StoryboardNodeRoute
  | StoryboardNodeTemplate
  | StoryboardNodeBrick
  | StoryboardNodeSlot
  | StoryboardNodeContext
  | StoryboardNodeResolvable
  | StoryboardNodeMenu
  | StoryboardNodeLifeCycle
  | StoryboardNodeEvent
  | StoryboardNodeEventHandler
  | StoryboardNodeConditionalEvent
  | StoryboardNodeEventCallback
  | StoryboardNodeCondition
  | StoryboardNodeUseBrickEntry
  | StoryboardNodeUseBackendEntry
  | StoryboardNodeMetaMenu
  | StoryboardNodeMetaMenuItem;

export interface StoryboardNodeRoot {
  type: "Root";
  raw: Storyboard;
  routes: StoryboardNodeRoute[];
  templates: StoryboardNodeTemplate[];
  menus: StoryboardNodeMetaMenu[];
}

export interface StoryboardNodeTemplate {
  type: "Template";
  raw: CustomTemplate | CustomTemplateConstructor;
  bricks?: StoryboardNodeBrick[];
  context?: StoryboardNodeContext[];
}

export interface StoryboardNodeRoute {
  type: "Route";
  raw: RouteConf;
  context?: StoryboardNodeContext[];
  redirect?: StoryboardNodeResolvable;
  menu?: StoryboardNodeMenu;
  providers?: StoryboardNodeBrick[];
  defineResolves?: StoryboardNodeResolvable[];
  children: StoryboardNodeRoute[] | StoryboardNodeBrick[];
}

export type StoryboardNodeBrick =
  | StoryboardNodeNormalBrick
  | StoryboardNodeUseBrick;

export interface StoryboardNodeBrickBase {
  type: "Brick";
  raw: BrickConf | UseSingleBrickConf;
  isUseBrick?: boolean;
  if?: StoryboardNodeCondition;
  events?: StoryboardNodeEvent[];
  lifeCycle?: StoryboardNodeLifeCycle[];
  useBrick?: StoryboardNodeUseBrickEntry[];
  useBackend?: StoryboardNodeUseBackendEntry[];
  context?: StoryboardNodeContext[];
  children: StoryboardNodeSlot[];
}

export interface StoryboardNodeNormalBrick extends StoryboardNodeBrickBase {
  raw: BrickConf;
  isUseBrick?: false;
}

export interface StoryboardNodeUseBrick extends StoryboardNodeBrickBase {
  raw: UseSingleBrickConf;
  isUseBrick: true;
}

export interface StoryboardNodeUseBrickEntry
  extends StoryboardNodeUseEntryBase {
  type: "UseBrickEntry";
  rawKey: "useBrick";
}

export interface StoryboardNodeUseBackendEntry
  extends StoryboardNodeUseEntryBase {
  type: "UseBackendEntry";
  rawKey: "useBackend";
}

export interface StoryboardNodeUseEntryBase {
  rawContainer: Record<string, unknown>;
  children: StoryboardNodeBrick[];
}

export type StoryboardNodeCondition =
  | StoryboardNodeLiteralCondition
  | StoryboardNodeResolvableCondition;

export interface StoryboardNodeLiteralCondition {
  type: "LiteralCondition";
}

export interface StoryboardNodeResolvableCondition {
  type: "ResolvableCondition";
  resolve: StoryboardNodeResolvable | undefined;
}

export interface StoryboardNodeSlot {
  type: "Slot";
  raw: SlotConf;
  slot: string;
  childrenType: "Route" | "Brick";
  children: StoryboardNodeRoute[] | StoryboardNodeBrick[];
}

export interface StoryboardNodeContext {
  type: "Context";
  raw: ContextConf /* | CustomTemplateState */;
  resolve?: StoryboardNodeResolvable;
  onChange?: StoryboardNodeEventHandler[];
}

export interface StoryboardNodeResolvable {
  type: "Resolvable";
  raw: ResolveConf;
  isConditional?: boolean;
}

export type StoryboardNodeMenu =
  | StoryboardNodeFalseMenu
  | StoryboardNodeStaticMenu
  | StoryboardNodeBrickMenu
  | StoryboardNodeResolvableMenu;

export interface StoryboardNodeFalseMenu {
  type: "FalseMenu";
}

export interface StoryboardNodeStaticMenu {
  type: "StaticMenu";
}

export interface StoryboardNodeBrickMenu {
  type: "BrickMenu";
  raw: LegacyBrickMenuConf;
  brick?: StoryboardNodeBrick;
}

export interface StoryboardNodeResolvableMenu {
  type: "ResolvableMenu";
  resolve?: StoryboardNodeResolvable;
}

export type StoryboardNodeLifeCycle =
  | StoryboardNodeResolveLifeCycle
  | StoryboardNodeSimpleLifeCycle
  | StoryboardNodeConditionalLifeCycle
  | StoryboardNodeUnknownLifeCycle;

export interface StoryboardNodeResolveLifeCycle {
  type: "ResolveLifeCycle";
  rawContainer: BrickLifeCycle;
  rawKey: "useResolves";
  resolves: StoryboardNodeResolvable[] | undefined;
}

export interface StoryboardNodeSimpleLifeCycle {
  type: "SimpleLifeCycle";
  name:
    | "onPageLoad"
    | "onPageLeave"
    | "onAnchorLoad"
    | "onAnchorUnload"
    | "onMessageClose"
    | "onBeforePageLoad"
    | "onBeforePageLeave"
    | "onMount"
    | "onUnmount"
    | "onMediaChange";
  rawContainer: BrickLifeCycle;
  rawKey: string;
  handlers: StoryboardNodeEventHandler[];
}

export interface StoryboardNodeConditionalLifeCycle {
  type: "ConditionalLifeCycle";
  name: "onMessage" | "onScrollIntoView";
  events: StoryboardNodeConditionalEvent[] | undefined;
}

export interface StoryboardNodeUnknownLifeCycle {
  type: "UnknownLifeCycle";
  rawContainer: BrickLifeCycle;
  rawKey: string;
}

export interface StoryboardNodeEvent {
  type: "Event";
  rawContainer: BrickEventsMap;
  rawKey: string;
  handlers: StoryboardNodeEventHandler[] | undefined;
}

export interface StoryboardNodeEventHandler {
  type: "EventHandler";
  raw: BrickEventHandler;
  /**
   * `rawKey: undefined` means the event handler is not in an array.
   * `rawKey: number` means the event handler is in an array.
   */
  rawKey?: number;
  callback: StoryboardNodeEventCallback[] | undefined;
  then: StoryboardNodeEventHandler[] | undefined;
  else: StoryboardNodeEventHandler[] | undefined;
}

export interface StoryboardNodeConditionalEvent {
  type: "ConditionalEvent";
  rawContainer: MessageConf | ScrollIntoViewConf;
  rawKey: "handlers";
  handlers: StoryboardNodeEventHandler[] | undefined;
}

export interface StoryboardNodeEventCallback {
  type: "EventCallback";
  rawContainer: BrickEventHandlerCallback;
  rawKey: string;
  handlers: StoryboardNodeEventHandler[] | undefined;
}

export interface StoryboardNodeMetaMenu {
  type: "MetaMenu";
  raw: MenuRawData;
  items?: StoryboardNodeMetaMenuItem[];
}

export interface StoryboardNodeMetaMenuItem {
  type: "MetaMenuItem";
  raw: MenuItemRawData;
  children?: StoryboardNodeMetaMenuItem[];
}
