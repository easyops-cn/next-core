import React from "react";
import ReactDOM from "react-dom";
import { BrickWrapper, UpdatingElement } from "@easyops/brick-kit";
import { $PascalBrickName$ } from "./$PascalBrickName$";

class $PascalBrickName$Element extends UpdatingElement {
  connectedCallback(): void {
    this.style.display = "block";
    this._render();
  }

  disconnectedCallback(): void {
    ReactDOM.unmountComponentAtNode(this);
  }

  protected _render(): void {
    // istanbul ignore else
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
