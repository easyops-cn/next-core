import { merge } from "lodash";
import { UpdatingElement } from "../UpdatingElement";
import { property } from "../decorators";

/**
 * 模态框类构件的抽象基类。
 */
export abstract class ModalElement extends UpdatingElement {
  /**
   * 模态框当前是否可见。
   */
  @property({
    type: Boolean,
  })
  public isVisible: boolean;

  /**
   * 打开模态框。
   *
   * @param e
   */
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

  /**
   * 关闭模态框。
   */
  closeModal = (): void => {
    this.isVisible = false;
    this._render();
  };
}
