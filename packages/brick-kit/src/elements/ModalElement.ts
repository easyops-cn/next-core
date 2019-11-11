import { merge } from "lodash";
import { UpdatingElement } from "../UpdatingElement";
import { property } from "../decorators";

export abstract class ModalElement extends UpdatingElement {
  @property({
    type: Boolean
  })
  public isVisible: boolean;

  openModal = (e?: CustomEvent): void => {
    if (e) {
      if (typeof e.detail === "object" && !Array.isArray(e.detail)) {
        merge(this, e.detail);
      } else {
        merge(this, { detail: e.detail });
      }
    }
    this.isVisible = true;
    this._render();
  };

  closeModal = (): void => {
    this.isVisible = false;
    this._render();
  };
}
