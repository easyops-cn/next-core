import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { UpdatingElement } from "@next-core/element";

export abstract class ReactUpdatingElement extends UpdatingElement {
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
    this.#root?.render(this._renderReact());
  }

  protected abstract _renderReact(): React.ReactNode;
}
