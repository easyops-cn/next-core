import {
  CustomTemplateProxyBasicProperty,
  CustomTemplateProxyProperty,
} from "@easyops/brick-types";
import { transformElementProperties } from "../../transformProperties";
import { RuntimeBrick } from "../BrickNode";
import {
  isMergeableProperty,
  isRefProperty,
  isTransformableProperty,
} from "./assertions";
import { propertyMerge } from "./propertyMerge";

export function handleProxyOfCustomTemplate(brick: RuntimeBrick): void {
  if (!brick.proxyRefs) {
    return;
  }

  const node = brick.element as any;

  function getElementByRef(ref: string): HTMLElement {
    if (brick.proxyRefs.has(ref)) {
      return brick.proxyRefs.get(ref).brick?.element;
    }
  }

  // For usages of `targetRef: "..."`.
  // `tpl.$$getElementByRef(ref)` will return the ref element inside a custom template.
  Object.defineProperty(node, "$$getElementByRef", {
    value: getElementByRef,
  });

  if (!brick.proxy) {
    return;
  }

  const handleExtraOneWayRefs = (
    propName: string,
    propRef: CustomTemplateProxyProperty,
    value: unknown
  ): void => {
    if (isRefProperty(propRef) && Array.isArray(propRef.extraOneWayRefs)) {
      for (const extraRef of propRef.extraOneWayRefs) {
        const extraRefElement = getElementByRef(extraRef.ref) as any;
        // should always have refElement.
        // istanbul ignore else
        if (extraRefElement) {
          if (isTransformableProperty(extraRef)) {
            transformElementProperties(
              extraRefElement as HTMLElement,
              {
                [propName]: value,
              },
              extraRef.refTransform
            );
          } else if (isMergeableProperty(extraRef)) {
            extraRefElement[extraRef.mergeProperty] = propertyMerge(
              extraRef,
              value,
              node
            );
          } else {
            extraRefElement[
              (extraRef as CustomTemplateProxyBasicProperty).refProperty
            ] = value;
          }
        }
      }
    }
  };

  const { $$properties: properties, events, methods } = brick.proxy;
  if (properties) {
    for (const [propName, propRef] of Object.entries(properties)) {
      const refElement = getElementByRef(propRef.ref) as any;
      // should always have refElement.
      // istanbul ignore else
      if (refElement) {
        if (isTransformableProperty(propRef) || isMergeableProperty(propRef)) {
          // Create a non-enumerable symbol property to delegate the tpl root property.
          const delegatedPropSymbol = Symbol(`delegatedProp:${propName}`);
          node[delegatedPropSymbol] = node[propName];
          Object.defineProperty(node, propName, {
            get: function () {
              return node[delegatedPropSymbol];
            },
            set: function (value: unknown) {
              node[delegatedPropSymbol] = value;
              if (isTransformableProperty(propRef)) {
                transformElementProperties(
                  refElement,
                  {
                    [propName]: value,
                  },
                  propRef.refTransform
                );
              } else {
                refElement[propRef.mergeProperty] = propertyMerge(
                  propRef,
                  value,
                  node
                );
              }
              handleExtraOneWayRefs(propName, propRef, value);
            },
            enumerable: true,
          });
        } else {
          Object.defineProperty(node, propName, {
            get: function () {
              return refElement[propRef.refProperty];
            },
            set: function (value: unknown) {
              refElement[propRef.refProperty] = value;
              handleExtraOneWayRefs(propName, propRef, value);
            },
            enumerable: true,
          });
        }
      }
    }
  }

  if (events) {
    for (const [eventType, eventRef] of Object.entries(events)) {
      const refElement = getElementByRef(eventRef.ref);
      // should always have refElement.
      // istanbul ignore else
      if (refElement) {
        refElement.addEventListener(eventRef.refEvent, (e) => {
          if (e.bubbles) {
            e.stopPropagation();
          }
          (node as HTMLElement).dispatchEvent(
            new CustomEvent(eventType, {
              detail: (e as CustomEvent).detail,
              bubbles: e.bubbles,
              cancelable: e.cancelable,
              composed: e.composed,
            })
          );
        });
      }
    }
  }

  if (methods) {
    for (const [method, methodRef] of Object.entries(methods)) {
      const refElement = getElementByRef(methodRef.ref) as any;
      // should always have refElement.
      // istanbul ignore else
      if (refElement) {
        Object.defineProperty(node, method, {
          value: function (...args: unknown[]) {
            return refElement[methodRef.refMethod](...args);
          },
        });
      }
    }
  }
}
