import {
  CustomTemplateProxyBasicProperty,
  CustomTemplateProxyMergeableProperty,
  CustomTemplateProxyProperty,
  CustomTemplateProxyRefProperty,
  CustomTemplateProxyTransformableProperty,
  CustomTemplateProxyVariableProperty,
} from "@easyops/brick-types";

export function isBasicProperty(
  propRef: CustomTemplateProxyProperty
): propRef is CustomTemplateProxyBasicProperty {
  return !!(propRef as CustomTemplateProxyBasicProperty).refProperty;
}

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

export function isRefProperty(
  propRef: CustomTemplateProxyProperty
): propRef is CustomTemplateProxyRefProperty {
  return !!(propRef as CustomTemplateProxyRefProperty).ref;
}

export function isVariableProperty(
  propRef: CustomTemplateProxyProperty
): propRef is CustomTemplateProxyVariableProperty {
  return !!(propRef as CustomTemplateProxyVariableProperty).asVariable;
}
