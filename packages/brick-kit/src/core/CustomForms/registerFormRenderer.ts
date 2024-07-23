import { formRenderer } from "./constants";
import { formContainers } from "./ExpandCustomForm";

class FormElement extends HTMLElement {
  get $$typeof(): string {
    return "formRenderer";
  }

  #proxyFormMethod(method: string, args: unknown[] = []): void {
    const containerElement = this.firstElementChild;

    const tagName = containerElement?.tagName?.toLowerCase();

    if (formContainers.includes(tagName as string)) {
      (containerElement as any)[method](...args);
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
}

export function registerFormRenderer(): void {
  customElements.get(formRenderer) ||
    customElements.define(formRenderer, FormElement);
}
