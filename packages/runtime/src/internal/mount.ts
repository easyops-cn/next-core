import { handleProxyOfCustomTemplate } from "./CustomTemplates/handleProxyOfCustomTemplate.js";
import { bindListeners } from "./bindListeners.js";
import { setRealProperties } from "./compute/setRealProperties.js";
import { RenderTag } from "./enums.js";
import type { RenderNode, RenderRoot } from "./interfaces.js";

export function unmountTree(mountPoint: HTMLElement) {
  mountPoint.innerHTML = "";
}

export function mountTree(
  root: RenderRoot,
  initializedElement?: HTMLElement
): void {
  let current = root.child;
  const portalElements: HTMLElement[] = [];
  while (current) {
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

    const element =
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
    setRealProperties(element, current.properties);
    bindListeners(element, current.events, current.runtimeContext);

    if (current.portal) {
      portalElements.push(element);
    } else if (current.return) {
      if (!current.return.childElements) {
        current.return.childElements = [];
      }
      current.return.childElements.push(element);
    }

    if (current.child) {
      current = current.child;
    } else if (current.sibling) {
      current = current.sibling;
    } else {
      let currentReturn: RenderNode | null | undefined = current.return;
      while (currentReturn) {
        // Append elements inside out
        if (currentReturn.childElements) {
          if (currentReturn.tag === RenderTag.ROOT) {
            currentReturn.container?.append(...currentReturn.childElements);

            if (portalElements.length > 0) {
              const portal =
                typeof currentReturn.createPortal === "function"
                  ? currentReturn.createPortal()
                  : currentReturn.createPortal;
              portal.append(...portalElements);
            }
          } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            currentReturn.element!.append(...currentReturn.childElements);
          }
          currentReturn.childElements = undefined;
        }
        if (currentReturn.sibling) {
          break;
        }
        currentReturn = currentReturn.return;
      }
      current = currentReturn?.sibling;
    }
  }
}

export function afterMountTree(root: RenderRoot) {
  let current = root.child;
  while (current) {
    handleProxyOfCustomTemplate(current);
    if (current.child) {
      current = current.child;
    } else if (current.sibling) {
      current = current.sibling;
    } else {
      let currentReturn: RenderNode | null | undefined = current.return;
      while (currentReturn) {
        if (currentReturn.sibling) {
          break;
        }
        currentReturn = currentReturn.return;
      }
      current = currentReturn?.sibling;
    }
  }
}
