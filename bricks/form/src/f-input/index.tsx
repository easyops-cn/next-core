import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { createDecorators, UpdatingElement } from "@next-core/element";

const { defineElement, property } = createDecorators();

@defineElement("f-input")
class FInput extends UpdatingElement {
  _root: Root;

  get label() {
    return this.getAttribute("label");
  }

  set label(value) {
    this.setAttribute("label", value);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    this._root = createRoot(shadowRoot);
  }

  connectedCallback() {
    this._root.render(
      <div>
        <label>
          <span>{this.label}: </span>
          <input placeholder="It works" />
        </label>
      </div>
    );
  }

  disconnectedCallback() {
    this._root.unmount();
  }
}
