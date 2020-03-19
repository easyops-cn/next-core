import {
  PluginRuntimeContext,
  BrickLifeCycle,
  RefForProxy,
  CustomTemplateProxy
} from "@easyops/brick-types";
import { bindListeners } from "../bindListeners";
import { setRealProperties } from "../setProperties";
import { getHistory } from "../history";
import { handleProxyOfCustomTemplate } from "./CustomTemplates";

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
  private currentElement: RuntimeBrick;
  private children: BrickNode[];

  constructor(brick: RuntimeBrick) {
    this.currentElement = brick;
  }

  mount(): HTMLElement {
    const brick = this.currentElement;

    if (brick.type.includes("-") && !customElements.get(brick.type)) {
      // eslint-disable-next-line no-console
      console.error(`Undefined custom element: ${brick.type}`);
    }

    if (brick.type === "basic-bricks.script-brick") {
      // eslint-disable-next-line no-console
      console.warn(
        "`basic-bricks.script-brick` is deprecated, please take caution when using it"
      );
    }

    const node = document.createElement(brick.type);
    brick.element = node;

    if (brick.slotId) {
      node.setAttribute("slot", brick.slotId);
    }
    setRealProperties(node, brick.properties);
    // Todo(steve): refine
    bindListeners(node, brick.events, getHistory(), brick.context);

    if (Array.isArray(brick.children)) {
      this.children = brick.children.map(slot => new BrickNode(slot));
      const childNodes = this.children.map(slot => slot.mount());
      childNodes.forEach(slot => node.appendChild(slot));
    } else {
      this.children = [];
    }

    handleProxyOfCustomTemplate(brick);

    return node;
  }

  unmount(): void {
    this.children.forEach(slot => {
      slot.unmount();
    });
  }
}
