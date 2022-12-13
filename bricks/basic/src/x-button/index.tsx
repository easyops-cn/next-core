import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { createDecorators, UpdatingElement } from "@next-core/element";

const { defineElement, property, method, createEventEmitter } =
  createDecorators();

@defineElement("x-button")
class XButton extends UpdatingElement {
  // Track https://github.com/babel/babel/issues/15205
  // @property() accessor label: string | undefined;
  @property() accessor label;

  @property() accessor suffix = "!!";

  #clickEvent = createEventEmitter<string>({ type: "oops" }, this);

  @method()
  click() {
    // eslint-disable-next-line no-console
    console.log("click");
    this.#clickEvent.emit("ok");
  }

  #root: Root | undefined;

  #createRoot(): void {
    if (!this.#root) {
      const shadowRoot = this.attachShadow({ mode: "open" });
      this.#root = createRoot(shadowRoot);
    }
  }

  connectedCallback() {
    this.#createRoot();
    this._render();
  }

  disconnectedCallback() {
    this.#root?.render(null);
  }

  protected _render() {
    if (!this.isConnected) {
      return;
    }
    // console.log("rendered", this.label, this.suffix);
    this.#root?.render(
      <button>
        {this.label}
        <slot />
        {this.suffix}
      </button>
    );
  }
}

export { XButton };
