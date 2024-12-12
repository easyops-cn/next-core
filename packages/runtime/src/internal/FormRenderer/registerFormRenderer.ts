import { FORM_RENDERER } from "./constants.js";
import { formContainers } from "./expandFormRenderer.js";

interface FormElementProps {
  renderRoot?: boolean;
}

class FormElement extends HTMLElement implements FormElementProps {
  get $$typeof(): string {
    return "formRenderer";
  }

  renderRoot?: boolean | undefined;

  #proxyFormMethod(method: string, args: unknown[] = []): any {
    const containerElement =
      this.renderRoot !== false
        ? this.firstElementChild?.firstElementChild
        : this.firstElementChild;

    const tagName = containerElement?.tagName?.toLowerCase();

    if (formContainers.includes(tagName as string)) {
      return (containerElement as any)[method](...args);
    } else {
      // eslint-disable-next-line no-console
      console.error(`no ${method} method in the container element`, {
        container: tagName,
      });
    }
  }

  validate(): void {
    this.#proxyFormMethod("validate");
  }

  setInitValue(...args: unknown[]): void {
    this.#proxyFormMethod("setInitValue", args);
  }

  resetFields(...args: unknown[]): void {
    this.#proxyFormMethod("resetFields", args);
  }

  getFieldsValue(...args: unknown[]): any {
    return this.#proxyFormMethod("getFieldsValue", args);
  }
}

export function registerFormRenderer(): void {
  customElements.get(FORM_RENDERER) ||
    customElements.define(FORM_RENDERER, FormElement);
}
