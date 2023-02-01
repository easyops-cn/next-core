// import React from "react";
// import { createRoot, type Root } from "react-dom/client";
import { createDecorators, NextElement } from "@next-core/element";

const { defineElement, property } = createDecorators();

@defineElement("form.f-select")
class FSelect extends NextElement {
  // _root: Root;

  @property() accessor label: string;

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this._render();
  }

  disconnectedCallback() {
    this.shadowRoot.innerHTML = "";
    // this._root.unmount();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <div>
        <label>
          <span>${escapeHtml(this.label)}: </span>
          <select>
            <option>Male</option>
            <option>Female</option>
          </select>
        </label>
      </div>
    `;
    // this._root.render(
    //   <div>
    //     <label>
    //       <span>{this.label}</span>
    //       <select>
    //         <option>Male: </option>
    //         <option>Female</option>
    //       </select>
    //     </label>
    //   </div>
    // );
  }
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
