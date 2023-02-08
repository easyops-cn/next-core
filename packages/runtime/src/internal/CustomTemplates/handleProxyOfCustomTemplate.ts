import { RuntimeBrickElement } from "@next-core/brick-types";
import { RuntimeBrick } from "../Renderer.js";

export function handleProxyOfCustomTemplate(brick: RuntimeBrick) {
  const {
    element: node,
    internalBricksByRef,
    proxy,
  } = brick as RuntimeBrick & { element: RuntimeBrickElement };

  // Ignore non-tpl bricks.
  if (!internalBricksByRef) {
    return;
  }

  function getElementByRef(ref: string): HTMLElement | undefined {
    return internalBricksByRef!.get(ref)?.brick?.element;
  }

  const firstRun = !node.$$getElementByRef;

  if (firstRun) {
    // For usages of `targetRef: "..."`.
    // `tpl.$$getElementByRef(ref)` will return the ref element inside a custom template.
    Object.defineProperty(node, "$$getElementByRef", {
      value: getElementByRef,
    });

    // if (brick.stateNames) {
    //   // Define properties from state for tpl.
    //   const getState = (): StoryboardContextWrapper =>
    //     getCustomTemplateContext(brick.tplContextId).state;
    //   for (const propName of brick.stateNames) {
    //     Object.defineProperty(node, propName, {
    //       get: function () {
    //         return getState().getValue(propName);
    //       },
    //       set: function (value: unknown) {
    //         getState().updateValue(propName, value, "replace");
    //       },
    //       enumerable: true,
    //     });
    //   }
    // }
  }

  if (!proxy) {
    return;
  }

  const { properties, events, methods } = proxy;

  if (properties) {
    for (const [from, to] of Object.entries(properties)) {
      // should always have refElement.
      const refElement = getElementByRef(to.ref) as unknown as Record<
        string,
        unknown
      >;
      // istanbul ignore else
      if (refElement) {
        Object.defineProperty(node, from, {
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
          node.dispatchEvent(
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
        Object.defineProperty(node, from, {
          value(...args: unknown[]) {
            return refElement[to.refMethod](...args);
          },
        });
      }
    }
  }
}
