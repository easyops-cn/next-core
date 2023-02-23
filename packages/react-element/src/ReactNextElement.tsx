import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextElement, supportsAdoptingStyleSheets } from "@next-core/element";

export abstract class ReactNextElement extends NextElement {
  #root: Root | undefined;

  #createRoot(): void {
    if (this.#root) {
      return;
    }
    const ctor = this.constructor as typeof ReactNextElement;
    if (ctor.shadowOptions) {
      const shadowRoot = this.attachShadow(ctor.shadowOptions);
      if (supportsAdoptingStyleSheets()) {
        if (ctor.styleTexts?.length) {
          const styleSheet = new CSSStyleSheet();
          styleSheet.replaceSync(ctor.styleTexts.join(""));
          shadowRoot.adoptedStyleSheets = [styleSheet];
        }
      }
      this.#root = createRoot(shadowRoot);
    } else {
      if (process.env.NODE_ENV !== "production" && ctor.styleTexts?.length) {
        throw new Error(
          "Use `styleTexts` with `shadowOptions: false` is not supported"
        );
      }
      this.#root = createRoot(this);
    }
  }

  connectedCallback() {
    super._markConnectedCallbackCalled();
    this.#createRoot();
    this._render();
  }

  disconnectedCallback() {
    this.#root?.render(null);
  }

  protected _render() {
    if (!this.isConnected || !this.#root) {
      return;
    }
    const ctor = this.constructor as typeof ReactNextElement;
    if (ctor.shadowOptions) {
      this.#root.render(
        supportsAdoptingStyleSheets() || !ctor.styleTexts?.length ? (
          this.render()
        ) : (
          <>
            <style>{ctor.styleTexts.join("\n")}</style>
            {this.render()}
          </>
        )
      );
    } else {
      this.#root.render(this.render());
    }
  }

  abstract render(): React.ReactNode;
}
