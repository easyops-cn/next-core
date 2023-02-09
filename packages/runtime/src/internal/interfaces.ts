import type { LegacyCompatibleRuntimeContext } from "@next-core/inject";
import type {
  BrickEventsMap,
  BrickPackage,
  CustomTemplateProxy,
  RuntimeBrickElement,
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
  internalBricksByRef?: Map<string, BrickHolder>;
  proxy?: CustomTemplateProxy;
}
