import React from "react";
import ReactDOM from "react-dom";
import { BrickWrapper, UpdatingElement } from "@easyops/brick-kit";
import { $PascalBrickName$ } from "./$PascalBrickName$";

/**
 * @id $kebab-brick-name$
 * @author $kebab-username$
 * @history
 * 1.x.0: 新增构件 `$kebab-brick-name$`
 * @docKind brick
 * @noInheritDoc
 */
export class $PascalBrickName$Element extends UpdatingElement {
  connectedCallback(): void {
    // Don't override user's style settings.
    // istanbul ignore else
    if (!this.style.display) {
      this.style.display = "block";
    }
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
