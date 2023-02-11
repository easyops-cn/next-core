import { bindListeners } from "./bindListeners.js";
import { setRealProperties } from "./compute/setRealProperties.js";
import { handleProxyOfCustomTemplate } from "./CustomTemplates/handleProxyOfCustomTemplate.js";
import type { RuntimeBrick } from "./interfaces.js";

export class BrickNode {
  private brick: RuntimeBrick;
  private children: BrickNode[] = [];
  public readonly hasInitialElement: boolean;

  constructor(brick: RuntimeBrick, initialElement?: HTMLElement) {
    this.brick = brick;
    brick.element = initialElement;
    this.hasInitialElement = !!initialElement;
  }

  mount(): HTMLElement {
    const brick = this.brick;
    const tagName = brick.type;

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

    let element: HTMLElement;
    if (this.hasInitialElement) {
      element = brick.element!;
    } else {
      element = document.createElement(tagName);
      brick.element = element;
    }

    if (brick.slotId) {
      element.setAttribute("slot", brick.slotId);
    }
    if (brick.iid) {
      element.dataset.iid = brick.iid;
    }
    setRealProperties(element, brick.properties);
    bindListeners(element, brick.events, brick.runtimeContext);

    if (Array.isArray(brick.children)) {
      this.children = brick.children.map((child) => new BrickNode(child));
      const childNodes = this.children.map((child) => child.mount());
      childNodes.forEach((child) => element.appendChild(child));
    } else {
      this.children = [];
    }

    return element;
  }

  unmount(): void {
    const element = this.brick.element;
    // for (const key of Object.keys(this.brick)) {
    //   delete this.brick[key as "element"];
    // }
    // this.brick = undefined!;
    this.children.forEach((child) => {
      child.unmount();
    });
    this.children.length = 0;
    if (this.hasInitialElement && element) {
      element.innerHTML = "";
    }
  }

  // Handle proxies later after bricks in portal and main both mounted.
  afterMount(): void {
    handleProxyOfCustomTemplate(this.brick);
    this.children.forEach((child) => {
      child.afterMount();
    });
  }
}
