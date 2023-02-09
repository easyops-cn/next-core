import type { RuntimeBrickElement } from "@next-core/brick-types";
import type { RuntimeBrick } from "../interfaces.js";
import { getTplStateStore } from "./utils.js";

export function handleProxyOfCustomTemplate(brick: RuntimeBrick) {
  const {
    element: tplHostElement,
    runtimeContext,
    tplHostMetadata,
  } = brick as RuntimeBrick & { element: RuntimeBrickElement };

  // Ignore non-tpl host bricks.
  if (!tplHostMetadata) {
    return;
  }

  // For usages of `targetRef: "..."`.
  // `tplHostElement.$$getElementByRef(ref)` will return the ref element inside a custom template.
  const getElementByRef = function (ref: string): HTMLElement | undefined {
    return tplHostMetadata.internalBricksByRef.get(ref)?.brick?.element;
  };

  const firstRun = !tplHostElement.$$getElementByRef;

  if (firstRun) {
    Object.defineProperty(tplHostElement, "$$getElementByRef", {
      value: getElementByRef,
    });

    if (tplHostMetadata.exposedStates.length > 0) {
      // Define properties from state for tpl.
      const store = getTplStateStore(
        {
          tplStateStoreId: tplHostMetadata.tplStateStoreId,
          tplStateStoreMap: runtimeContext.tplStateStoreMap,
        },
        "STATE"
      );
      for (const propName of tplHostMetadata.exposedStates) {
        Object.defineProperty(tplHostElement, propName, {
          get: function () {
            return store.getValue(propName);
          },
          set: function (value: unknown) {
            store.updateValue(propName, value, "replace");
          },
          enumerable: true,
        });
      }
    }
  }

  if (!tplHostMetadata.proxy) {
    return;
  }

  const { properties, events, methods } = tplHostMetadata.proxy;

  if (properties) {
    for (const [from, to] of Object.entries(properties)) {
      // should always have refElement.
      const refElement = getElementByRef(to.ref) as unknown as Record<
        string,
        unknown
      >;
      // istanbul ignore else
      if (refElement) {
        Object.defineProperty(tplHostElement, from, {
          get() {
            return refElement[to.refProperty];
          },
          set(value) {
            refElement[to.refProperty] = value;
          },
          enumerable: true,
        });
      }
    }
  }

  if (events) {
    for (const [from, to] of Object.entries(events)) {
      // should always have refElement.
      const refElement = getElementByRef(to.ref)!;
      // istanbul ignore else
      if (refElement) {
        const listener = (e: Event) => {
          if (e.bubbles) {
            e.stopPropagation();
          }
          tplHostElement.dispatchEvent(
            new CustomEvent(from, {
              detail: (e as CustomEvent).detail,
              bubbles: e.bubbles,
              cancelable: e.cancelable,
              composed: e.composed,
            })
          );
        };
        /**
         * useBrick 重新渲染会导致事件重复绑定发生
         * 为了防止代理事件重复绑定, 增加$$proxyEvents
         * 每次设置代理属性方法, 提前判断之前是否已经绑定, 如若有, 则解绑并删除
         */
        // if (refElement.$$proxyEvents) {
        //   refElement.$$proxyEvents = (
        //     refElement.$$proxyEvents as Array<
        //       [string, string, (e: Event) => void]
        //     >
        //   ).filter(([proxyEvent, event, listener]) => {
        //     if (proxyEvent === eventType) {
        //       refElement.removeEventListener(event, listener);
        //       return false;
        //     }
        //     return true;
        //   });
        // } else {
        //   refElement.$$proxyEvents = [];
        // }
        // refElement.$$proxyEvents.push([eventType, eventRef.refEvent, listener]);
        refElement.addEventListener(to.refEvent, listener);
      }
    }
  }

  if (methods) {
    for (const [from, to] of Object.entries(methods)) {
      // should always have refElement.
      const refElement = getElementByRef(to.ref) as unknown as Record<
        string,
        Function
      >;
      // istanbul ignore else
      if (refElement) {
        Object.defineProperty(tplHostElement, from, {
          value(...args: unknown[]) {
            return refElement[to.refMethod](...args);
          },
        });
      }
    }
  }
}
