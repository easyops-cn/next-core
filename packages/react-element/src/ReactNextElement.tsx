import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextElement, supportsAdoptingStyleSheets } from "@next-core/element";

export abstract class ReactNextElement extends NextElement {
  #root: Root | undefined;

  #createRoot(): void {
    if (!this.#root) {
      const shadowRoot = this.attachShadow({ mode: "open" });
      if (supportsAdoptingStyleSheets) {
        const styleTexts = (this.constructor as typeof ReactNextElement)
          .styleTexts;
        if (styleTexts?.length) {
          const styleSheet = new CSSStyleSheet();
          styleSheet.replaceSync(styleTexts.join(""));
          shadowRoot.adoptedStyleSheets = [styleSheet];
        }
      }
      this.#root = createRoot(shadowRoot);
    }
  }

  connectedCallback() {
    super.connectedCallback();
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
    let styleTexts: string[] | undefined;
    this.#root?.render(
      supportsAdoptingStyleSheets ||
        ((styleTexts = (this.constructor as typeof ReactNextElement)
          .styleTexts),
        !styleTexts?.length) ? (
        this.render()
      ) : (
        <>
          <style>{styleTexts.join("\n")}</style>
          {this.render()}
        </>
      )
    );
  }

  abstract render(): React.ReactNode;
}
