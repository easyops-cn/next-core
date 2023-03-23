import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import type { GeneralFormElement } from "../form/index.jsx";

const { method } = createDecorators();

export abstract class FormItemElement extends ReactNextElement {
  accessor isFormItemElement = true;
  accessor #_notRender = false;
  accessor #validate = "normal";

  set validateState(value: string) {
    this.#validate = value;
    this._render();
  }
  get validateState() {
    return this.#validate;
  }

  /**
   * @required false
   * @default false
   * @description 控制该表单项是否隐藏
   * @group ui
   */
  set notRender(value: boolean) {
    this.hidden = value;
    this.#_notRender = value;
    this._render();
  }
  get notRender(): boolean {
    return this.#_notRender;
  }

  /**
   * @description
   */
  @method()
  getFormElement(): GeneralFormElement {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let element: HTMLElement & { isFormElement?: boolean } = this;
    while ((element = element.parentNode as HTMLElement)) {
      if (!element || element.isFormElement) {
        break;
      }
    }
    return element as unknown as GeneralFormElement;
  }
}
