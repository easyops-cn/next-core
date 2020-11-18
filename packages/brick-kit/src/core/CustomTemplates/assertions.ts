import {
  CustomTemplateProxyMergeableProperty,
  CustomTemplateProxyProperty,
  CustomTemplateProxyTransformableProperty,
} from "@easyops/brick-types";

export function isTransformableProperty(
  propRef: CustomTemplateProxyProperty
): propRef is CustomTemplateProxyTransformableProperty {
  return !!(propRef as CustomTemplateProxyTransformableProperty).refTransform;
}

export function isMergeableProperty(
  propRef: CustomTemplateProxyProperty
): propRef is CustomTemplateProxyMergeableProperty {
  return !!(propRef as CustomTemplateProxyMergeableProperty).mergeProperty;
}
