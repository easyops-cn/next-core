import {
  CustomTemplateProxy,
  CustomTemplateProxyMergeableProperty,
  CustomTemplateProxyMergeablePropertyOfArray,
  CustomTemplateProxyMergeablePropertyOfObject,
  CustomTemplateProxyRefProperty,
  PluginRuntimeContext,
} from "@easyops/brick-types";

/** @internal */
export interface RuntimeCustomTemplateProxy extends CustomTemplateProxy {
  $$properties?: RuntimeCustomTemplateProxyProperties;
}

/** @internal */
export interface RuntimeCustomTemplateProxyProperties {
  [name: string]: PropertyProxy;
}

/** @internal */
export interface RuntimeExtraPropertyProxy {
  $$reversedRef?: string;
  $$mergeBase?: MergeBase;
}

/** @internal */
export type PropertyProxy = CustomTemplateProxyRefProperty &
  RuntimeExtraPropertyProxy;

/** @internal */
export interface MergeBase {
  proxies: MergeablePropertyProxy[];
  mergeType: CustomTemplateProxyMergeableProperty["mergeType"];
  baseValue: unknown;
  context: PluginRuntimeContext;
}

/** @internal */
export type MergeablePropertyProxy =
  | MergeablePropertyProxyOfArray
  | MergeablePropertyProxyOfObject;

/** @internal */
export type MergeablePropertyProxyOfArray = CustomTemplateProxyMergeablePropertyOfArray &
  RuntimeExtraPropertyProxy;

/** @internal */
export type MergeablePropertyProxyOfObject = CustomTemplateProxyMergeablePropertyOfObject &
  RuntimeExtraPropertyProxy;
