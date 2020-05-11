import {
  PluginRuntimeContext,
  BrickLifeCycle,
  RefForProxy,
  CustomTemplateProxy,
} from "@easyops/brick-types";
import { bindListeners } from "../bindListeners";
import { setRealProperties } from "../setProperties";
import { handleProxyOfCustomTemplate } from "./exports";

export interface RuntimeBrick {
  type?: string;
  properties?: Record<string, any>;
  template?: string;
  params?: Record<string, any>;
  events?: Record<string, any>;
  children?: RuntimeBrick[];
  slotId?: string;
  context?: PluginRuntimeContext;
  lifeCycle?: BrickLifeCycle;
  element?: HTMLElement;
  bg?: boolean;
  proxy?: CustomTemplateProxy;
  proxyRefs?: Map<string, RefForProxy>;
  refForProxy?: {
    brick?: RuntimeBrick;
  };
}

export class BrickNode {
  $$brick: RuntimeBrick;

  private children: BrickNode[] = [];

  constructor(brick: RuntimeBrick) {
    this.$$brick = brick;
  }

  mount(): HTMLElement {
    const brick = this.$$brick;
    const tagName = brick.type;

    if (tagName.includes("-") && !customElements.get(tagName)) {
      // eslint-disable-next-line no-console
      console.error(`Undefined custom element: ${tagName}`);
    }

    if (tagName === "basic-bricks.script-brick") {
      // eslint-disable-next-line no-console
      console.warn(
        "`basic-bricks.script-brick` is deprecated, please take caution when using it"
      );
    }

    const node = document.createElement(tagName);
    brick.element = node;

    if (brick.slotId) {
      node.setAttribute("slot", brick.slotId);
    }
    setRealProperties(node, brick.properties);
    bindListeners(node, brick.events, brick.context);

    if (Array.isArray(brick.children)) {
      this.children = brick.children.map((child) => new BrickNode(child));
      const childNodes = this.children.map((child) => child.mount());
      childNodes.forEach((child) => node.appendChild(child));
    } else {
      this.children = [];
    }

    return node;
  }

  unmount(): void {
    this.children.forEach((child) => {
      child.unmount();
    });
  }

  // Handle proxies later after bricks in portal and main both mounted.
  afterMount(): void {
    handleProxyOfCustomTemplate(this.$$brick);
    this.children.forEach((child) => {
      child.afterMount();
    });
  }
}
