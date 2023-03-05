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

export interface RuntimeContext extends LegacyCompatibleRuntimeContext {
  ctxStore: DataStore<"CTX">;
  tplStateStoreMap: Map<string, DataStore<"STATE">>;
  pendingPermissionsPreCheck: (Promise<unknown> | undefined)[];
  tplStateStoreId?: string;
  forEachItem?: unknown;
}

export type AsyncProperties = Promise<Record<string, unknown>>;

export interface ElementHolder {
  element?: HTMLElement | null;
}

export interface BrickHolder {
  brick?: ElementHolder;
}

export interface RuntimeBrick {
  type: string;
  children: RuntimeBrick[];
  properties?: Record<string, unknown>;
  events?: BrickEventsMap;
  slotId?: string;
  element?: RuntimeBrickElement | null;
  iid?: string;
  runtimeContext: RuntimeContext;
  tplHostMetadata?: TemplateHostMetadata;
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
  /** Find element by ref in a custom template */
  $$getElementByRef?: (ref: string) => HTMLElement;
}

export interface TemplateHostMetadata {
  internalBricksByRef: Map<string, BrickHolder>;
  tplStateStoreId: string;
  exposedStates: string[];
  proxy?: CustomTemplateProxy;
}

export type TemplateHostBrick = RuntimeBrick & {
  tplHostMetadata: TemplateHostMetadata;
};

export interface TemplateHostContext {
  reversedProxies: ReversedProxies;
  asyncHostProperties?: AsyncProperties;
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
