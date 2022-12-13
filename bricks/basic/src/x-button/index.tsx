import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { createDecorators, UpdatingElement } from "@next-core/element";

const { defineElement, property } = createDecorators();

@defineElement("x-button")
class XButton extends UpdatingElement {
  _root: Root;

  // Track https://github.com/babel/babel/issues/15205
  // @property() accessor label: string | undefined;
  @property() accessor label;

  @property() accessor suffix = "!!";

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    this._root = createRoot(shadowRoot);
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    this._root.unmount();
  }

  protected _render() {
    if (!this.isConnected) {
      return;
    }
    // console.log("rendered", this.label, this.suffix);
    this._root.render(
      <button>
        {this.label}
        <slot />
        {this.suffix}
      </button>
    );
  }
}

export { XButton };
