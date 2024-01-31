import { bindTemplateProxy } from "./CustomTemplates/bindTemplateProxy.js";
import { getTplStateStore } from "./CustomTemplates/utils.js";
import { bindListeners } from "./bindListeners.js";
import { setRealProperties } from "./compute/setRealProperties.js";
import { RenderTag } from "./enums.js";
import type {
  RenderReturnNode,
  RenderRoot,
  RuntimeBrickElement,
} from "./interfaces.js";

export function unmountTree(mountPoint: HTMLElement | DocumentFragment) {
  mountPoint.replaceChildren();
}

export function mountTree(
  root: RenderRoot,
  initializedElement?: RuntimeBrickElement
): void {
  window.DISABLE_REACT_FLUSH_SYNC = false;
  let current = root.child;
  const portalElements: RuntimeBrickElement[] = [];
  while (current) {
    if (current.tag === RenderTag.BRICK) {
      const tagName = current.type;

      if (tagName.includes("-") && !customElements.get(tagName)) {
        // eslint-disable-next-line no-console
        console.error(`Undefined custom element: ${tagName}`);
      }

      // istanbul ignore if
      if (tagName === "basic-bricks.script-brick") {
        // eslint-disable-next-line no-console
        console.warn(
          "`basic-bricks.script-brick` is deprecated, please take caution when using it"
        );
      }

      const element: RuntimeBrickElement =
        initializedElement && current === root.child
          ? initializedElement
          : document.createElement(tagName);
      current.element = element;

      if (current.slotId) {
        element.setAttribute("slot", current.slotId);
      }
      if (current.iid) {
        element.dataset.iid = current.iid;
      }
      if (current.tplHostMetadata?.tplStateStoreId) {
        element.dataset.tplStateStoreId =
          current.tplHostMetadata.tplStateStoreId;
      }
      setRealProperties(element, current.properties);
      bindListeners(element, current.events, current.runtimeContext);
      if (current.tplHostMetadata) {
        // 先设置属性，再设置 `$$tplStateStore`，这样，当触发属性设置时，
        // 避免初始化的一次 state update 操作及其 onChange 事件。
        element.$$tplStateStore = getTplStateStore(
          {
            tplStateStoreId: current.tplHostMetadata.tplStateStoreId,
            tplStateStoreMap: current.runtimeContext.tplStateStoreMap,
          },
          "mount"
        );
      }
      bindTemplateProxy(current);

      if (current.portal) {
        portalElements.push(element);
      } else if (current.return) {
        if (!current.return.childElements) {
          current.return.childElements = [];
        }
        current.return.childElements.push(element);
      }
    }

    if (current.child) {
      current = current.child;
    } else if (current.sibling) {
      current = current.sibling;
    } else {
      let currentReturn: RenderReturnNode | null | undefined = current.return;
      while (currentReturn) {
        // Append elements inside out
        if (currentReturn.childElements) {
          if (currentReturn.tag === RenderTag.ROOT) {
            currentReturn.container?.append(...currentReturn.childElements);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            currentReturn.element!.append(...currentReturn.childElements);
          }
          currentReturn.childElements = undefined;
        }

        if (currentReturn.tag === RenderTag.ROOT && portalElements.length > 0) {
          const portal =
            typeof currentReturn.createPortal === "function"
              ? currentReturn.createPortal()
              : currentReturn.createPortal;
          portal.append(...portalElements);
        }

        if (currentReturn.sibling) {
          break;
        }
        currentReturn = currentReturn.return;
      }
      current = currentReturn?.sibling;
    }
  }
  setTimeout(() => {
    window.DISABLE_REACT_FLUSH_SYNC = true;
  });
}
