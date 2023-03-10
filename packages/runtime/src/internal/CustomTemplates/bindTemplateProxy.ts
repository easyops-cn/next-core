import type { RuntimeBrick } from "../interfaces.js";
import { getTplStateStore } from "./utils.js";

export function bindTemplateProxy(brick: RuntimeBrick) {
  const { ref, runtimeContext, element } = brick;

  if (!runtimeContext.tplStateStoreId || !ref) {
    return;
  }

  const { hostBrick } = getTplStateStore(runtimeContext, "bindTemplateProxy");
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const tplHostMetadata = hostBrick!.tplHostMetadata!;

  tplHostMetadata.internalBricksByRef.set(ref, brick);

  const events = tplHostMetadata.proxy?.events;
  if (events) {
    for (const [from, to] of Object.entries(events)) {
      if (to.ref === ref) {
        const listener = (e: Event) => {
          if (e.bubbles) {
            e.stopPropagation();
          }
          hostBrick!.element!.dispatchEvent(
            new CustomEvent(from, {
              detail: (e as CustomEvent).detail,
              bubbles: e.bubbles,
              cancelable: e.cancelable,
              composed: e.composed,
            })
          );
        };
        const eventType = to.refEvent ?? from;
        element!.addEventListener(eventType, listener);
        element!.$$proxyListeners ??= [];
        element!.$$proxyListeners.push([eventType, listener]);
      }
    }
  }
}

export function unbindTemplateProxy(brick: RuntimeBrick) {
  const { ref, runtimeContext, element } = brick;

  if (!runtimeContext.tplStateStoreId || !ref) {
    return;
  }

  const { hostBrick } = getTplStateStore(runtimeContext, "unbindTemplateProxy");
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const tplHostMetadata = hostBrick!.tplHostMetadata!;

  tplHostMetadata.internalBricksByRef.delete(ref);

  for (const [type, fn] of element!.$$proxyListeners ?? []) {
    element!.removeEventListener(type, fn);
  }
  delete element!.$$proxyListeners;
}
