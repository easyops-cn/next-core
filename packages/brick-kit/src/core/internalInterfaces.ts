import {
  CustomTemplateProxyMergeableProperty,
  CustomTemplateProxyMergeablePropertyOfArray,
  CustomTemplateProxyMergeablePropertyOfObject,
  CustomTemplateProxyProperty,
} from "@easyops/brick-types";

/** @internal */
interface RuntimeExtraPropertyProxy {
  $$reversedRef?: string;
  $$mergeBase?: MergeBase;
}

export type PropertyProxy = CustomTemplateProxyProperty & {
  $$reversedRef?: string;
  $$mergeBase?: MergeBase;
};

/** @internal */
export interface MergeBase {
  proxies: MergeablePropertyProxy[];
  mergeType: CustomTemplateProxyMergeableProperty["mergeType"];
  baseValue: unknown;
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
