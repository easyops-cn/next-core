import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { createDecorators, UpdatingElement } from "@next-core/element";

const { defineElement, property } = createDecorators();

@defineElement("x-button")
class XButton extends UpdatingElement {
  _root: Root;

  @property()
  test: string;

  @property()
  test2: string;

  get prefix() {
    return this.getAttribute("prefix");
  }

  set prefix(value) {
    this.setAttribute("prefix", value);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    this._root = createRoot(shadowRoot);
  }

  connectedCallback() {
    this._root.render(
      <button>
        {this.prefix}
        <slot />
      </button>
    );
  }

  disconnectedCallback() {
    this._root.unmount();
  }
}

export { XButton };
