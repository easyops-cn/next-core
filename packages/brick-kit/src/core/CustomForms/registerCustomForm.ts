import { customFormRegistry } from "./constants";

export function registerCustomForm(formName: string, appId?: string): void {
  let tagName = formName;
  if (appId && !formName.includes(".")) {
    tagName = `${appId}.${formName}`;
  }
  const registered = customFormRegistry.has(tagName);
  if (registered) {
    // eslint-disable-next-line no-console
    console.warn(`Custom template of "${tagName}" already registered.`);
    return;
  }
  customFormRegistry.set(tagName);

  customElements.define(
    tagName,
    class TplElement extends HTMLElement {
      get $$typeof(): string {
        return "custom-form";
      }

      connectedCallback(): void {
        // Don't override user's style settings.
        // istanbul ignore else
        if (!this.style.display) {
          this.style.display = "block";
        }
      }
    }
  );
}
