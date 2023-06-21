import type { LegacyCompatibleRuntimeContext } from "@next-core/inject";
import type {
  BrickEventHandler,
  BrickEventsMap,
  CustomTemplateProxy,
  CustomTemplateProxyBasicProperty,
  CustomTemplateProxySlot,
  SlotsConfOfBricks,
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
  appendI18nNamespace?: string;

  formStateStoreMap: Map<string, DataStore<"FORM_STATE">>;
  formStateStoreId?: string;
  formStateStoreScope?: DataStore<"FORM_STATE">[];
}

export type AsyncComputedProperties = Promise<Record<string, unknown>>;

export type AsyncProperties = Record<string, Promise<unknown>>;

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
  return: RenderNode;
  hasTrackingControls?: boolean;
}

export interface BaseRenderNode {
  tag: RenderTag;
  child?: RenderBrick;
  sibling?: RenderBrick;
  return?: RenderNode | null;
  childElements?: HTMLElement[];
}

export type RenderNode = RenderRoot | RenderBrick;

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
}

export type MetaInfoOfEventListener = [
  string,
  // For compatibility of devtools, leave the second argument there.
  null | undefined,
  BrickEventHandler
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
  asyncHostProperties: AsyncProperties;
  externalSlots?: SlotsConfOfBricks;
  tplStateStoreId: string;
  hostBrick: TemplateHostBrick;
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
