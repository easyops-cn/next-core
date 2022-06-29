import { formRender } from "./constants";

export function registerFormRender(): void {
  customElements.get(formRender) ||
    customElements.define(
      formRender,
      class FormElement extends HTMLElement {
        get $$typeof(): string {
          return "formRender";
        }
      }
    );
}
