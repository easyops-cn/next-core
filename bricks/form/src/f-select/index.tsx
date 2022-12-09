// import React from "react";
// import { createRoot, type Root } from "react-dom/client";
import { createDecorators, UpdatingElement } from "@next-core/element";

const { defineElement, property } = createDecorators();

@defineElement("f-select")
class FSelect extends UpdatingElement {
  // _root: Root;

  get label() {
    return this.getAttribute("label");
  }

  set label(value) {
    this.setAttribute("label", value);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    // this._root = createRoot(shadowRoot);
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div>
        <label>
          <span>${this.label}: </span>
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

  disconnectedCallback() {
    this.shadowRoot.innerHTML = "";
    // this._root.unmount();
  }
}
