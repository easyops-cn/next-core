import type { LegacyCompatibleRuntimeContext } from "@next-core/inject";
import type {
  BrickEventsMap,
  BrickPackage,
  CustomTemplateProxy,
  CustomTemplateProxyBasicProperty,
  CustomTemplateProxySlot,
  RuntimeBrickElement,
  SlotsConfOfBricks,
} from "@next-core/brick-types";
import type { DataStore } from "./data/DataStore.js";

export interface RuntimeContext extends LegacyCompatibleRuntimeContext {
  brickPackages: BrickPackage[];
  ctxStore: DataStore<"CTX">;
  tplStateStoreMap: Map<string, DataStore<"STATE">>;
  pendingPermissionsPreCheck: (Promise<unknown> | undefined)[];
  tplStateStoreId?: string;
}

export type AsyncProperties = Promise<Record<string, unknown>>;

export type MaybeAsyncProperties = AsyncProperties | Record<string, unknown>;

export interface ElementHolder {
  element?: HTMLElement;
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
  element?: RuntimeBrickElement;
  iid?: string;
  runtimeContext: RuntimeContext;
  tplHostMetadata?: TemplateHostMetadata;
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
  hostProperties?: MaybeAsyncProperties;
  hostPropertiesAreAsync?: boolean;
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
