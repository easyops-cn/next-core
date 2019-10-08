import React from "react";
import ReactDOM from "react-dom";
import { BrickWrapper } from "@easyops/brick-kit";
import { $PascalBrickName$ } from "./$PascalBrickName$";

class $PascalBrickName$Element extends HTMLElement {
  connectedCallback(): void {
    this.style.display = "block";
    this._render();
  }

  disconnectedCallback(): void {
    ReactDOM.unmountComponentAtNode(this);
  }

  private _render(): void {
    if (this.isConnected) {
      ReactDOM.render(
        <BrickWrapper>
          <$PascalBrickName$ />
        </BrickWrapper>,
        this
      );
    }
  }
}

customElements.define("$kebab-brick-name$", $PascalBrickName$Element);
