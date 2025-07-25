import type { LegacyCompatibleRuntimeContext } from "@next-core/inject";
import type {
  BrickEventHandler,
  BrickEventsMap,
  CustomTemplate,
  RouteConf,
  RuntimeSnippet,
  CustomTemplateProxy,
  CustomTemplateProxyBasicProperty,
  CustomTemplateProxySlot,
  SlotsConfOfBricks,
  Storyboard,
  StaticMenuConf,
  UseProviderResolveConf,
  MicroApp,
} from "@next-core/types";
import type { DataStore } from "./data/DataStore.js";
import { RenderTag } from "./enums.js";
import { RuntimeBrickConfWithTplSymbols } from "./CustomTemplates/constants.js";
import { RuntimeBrickConfOfFormSymbols } from "./FormRenderer/constants.js";

export interface RuntimeContext extends LegacyCompatibleRuntimeContext {
  ctxStore: DataStore<"CTX">;
  tplStateStoreMap: Map<string, DataStore<"STATE">>;
  pendingPermissionsPreCheck: (Promise<unknown> | undefined)[];
  tplStateStoreId?: string;
  // `useBrick` has a local tpl state store scope
  tplStateStoreScope?: DataStore<"STATE">[];
  forEachItem?: unknown;
  forEachIndex?: number;
  forEachSize?: number;
  appendI18nNamespace?: string;

  formStateStoreMap: Map<string, DataStore<"FORM_STATE">>;
  formStateStoreId?: string;
  formStateStoreScope?: DataStore<"FORM_STATE">[];
  inUseBrick?: boolean;

  unsafe_penetrate?: boolean;
}

export type AsyncPropertyEntry = [
  name: string,
  value: Promise<unknown>,
  ignoreUndefined?: boolean,
];

export interface ElementHolder {
  element?: HTMLElement | null;
}

export interface RenderRoot extends BaseRenderNode {
  tag: RenderTag.ROOT;
  container?: HTMLElement | DocumentFragment;
  createPortal:
    | HTMLElement
    | DocumentFragment
    | (() => HTMLElement | DocumentFragment);
}

export interface RenderBrick extends BaseRenderNode, RuntimeBrick {
  tag: RenderTag.BRICK;
  return: RenderReturnNode;
}

export interface RenderAbstract extends BaseRenderNode {
  tag: RenderTag.ABSTRACT;
  return: RenderReturnNode;
  iid?: string;
  disposes?: (() => void)[];
}

export interface BaseRenderNode {
  tag: RenderTag;
  child?: RenderChildNode;
  sibling?: RenderChildNode;
  return?: RenderReturnNode | null;
  childElements?: HTMLElement[];
  disposed?: boolean;
  mounted?: boolean;
}

export type RenderNode = RenderRoot | RenderBrick | RenderAbstract;
export type RenderChildNode = RenderBrick | RenderAbstract;
export type RenderReturnNode = RenderNode;

export interface RuntimeBrick {
  type: string;
  properties?: Record<string, unknown>;
  events?: BrickEventsMap;
  slotId?: string;
  element?: RuntimeBrickElement | null;
  iid?: string;
  runtimeContext: RuntimeContext;
  tplHostMetadata?: TemplateHostMetadata;
  portal?: boolean;
  ref?: string;
  disposes?: (() => void)[];
  disposed?: boolean;
}

export type MetaInfoOfEventListener = [
  string,
  // For compatibility of devtools, leave the second argument there.
  null | undefined,
  BrickEventHandler,
];

export type RememberedEventListener = [string, EventListener];

export interface RuntimeBrickElement extends HTMLElement {
  $$typeof?: "brick" | "provider" | "custom-template" | "native" | "invalid";
  /** Meta info of listeners, for devtools only */
  $$eventListeners?: MetaInfoOfEventListener[];
  /** Remembered listeners for unbinding */
  $$listeners?: RememberedEventListener[];
  /** Remembered proxy listeners for unbinding */
  $$proxyListeners?: RememberedEventListener[];
  /** Find element by ref in a custom template */
  $$getElementByRef?: (ref: string) => HTMLElement | null | undefined;
  $$tplStateStore?: DataStore<"STATE">;
}

export interface TemplateHostMetadata {
  internalBricksByRef: Map<string, RuntimeBrick>;
  tplStateStoreId: string;
  proxy?: CustomTemplateProxy;
}

export type TemplateHostBrick = RuntimeBrick & {
  tplHostMetadata: TemplateHostMetadata;
};

export interface TemplateHostContext {
  reversedProxies: ReversedProxies;
  asyncHostPropertyEntries: AsyncPropertyEntry[];
  externalSlots?: SlotsConfOfBricks;
  tplStateStoreId: string;
  hostBrick: TemplateHostBrick;
  usedSlots: Set<string>;
}

interface ReversedProxies {
  properties: Map<string, ReversedPropertyProxy[]>;
  slots: Map<string, ReversedSlotProxy[]>;
}

interface ReversedPropertyProxy {
  from: string;
  to: CustomTemplateProxyBasicProperty;
}

interface ReversedSlotProxy {
  from: string;
  to: CustomTemplateProxySlot;
}

export type RuntimeBrickConfWithSymbols = RuntimeBrickConfWithTplSymbols &
  RuntimeBrickConfOfFormSymbols;

export interface DataValueOption {
  tplStateStoreId?: string;
  routeId?: string;
}

export type PreviewStoryboardPatch =
  | CustomTemplate
  | RouteConf
  | RuntimeSnippet;

export interface PreviewOption {
  appId: string;
  formId?: string;
  updateStoryboardType?: "route" | "template" | "snippet";
  collectUsedContracts?(storyboard: Storyboard): string[] | Promise<string[]>;
}

export interface MenuRequestNode {
  child?: MenuRequestNode;
  sibling?: MenuRequestNode;
  return?: MenuRequestNode;
  request?: Promise<StaticMenuConf>;
}

export interface DebugDataValue {
  resolve?: UseProviderResolveConf;
  value?: unknown;
}

export interface RuntimeDataVale
  extends Pick<LegacyCompatibleRuntimeContext, "match" | "sys" | "query"> {
  location: {
    href: string;
    origin: string;
    hostname: string;
    host: string;
  };
  app?: MicroApp;
}

export interface RuntimeDataValueOption {
  routeId?: string;
}
