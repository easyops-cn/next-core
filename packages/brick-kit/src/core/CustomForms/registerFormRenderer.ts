import { formRenderer } from "./constants";

export function registerFormRenderer(): void {
  customElements.get(formRenderer) ||
    customElements.define(
      formRenderer,
      class FormElement extends HTMLElement {
        get $$typeof(): string {
          return "formRenderer";
        }
      }
    );
}
