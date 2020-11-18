import { CustomTemplateConstructor } from "@easyops/brick-types";
import { appRegistered, customTemplateRegistry } from "./constants";

export function registerCustomTemplate(
  tplName: string,
  tplConstructor: CustomTemplateConstructor,
  appId?: string
): void {
  let tagName = tplName;
  // When a template is registered by an app, its namespace maybe missed.
  if (appId && !tplName.includes(".")) {
    tagName = `${appId}.${tplName}`;
  }
  if (customTemplateRegistry.has(tagName)) {
    // When open launchpad, the storyboard will be updated.
    // However, we can't *undefine* a custom element.
    // Just ignore re-registering custom templates.
    if (!appId || appRegistered.has(appId)) {
      // eslint-disable-next-line no-console
      console.error(`Custom template of "${tagName}" already registered.`);
    }
    return;
  }
  if (customElements.get(tagName)) {
    // eslint-disable-next-line no-console
    console.error(
      `Custom template of "${tagName}" already defined by customElements.`
    );
    return;
  }
  customTemplateRegistry.set(tagName, {
    ...tplConstructor,
    name: tagName,
  });

  // Collect defined properties of the template.
  const props = Object.keys(tplConstructor.proxy?.properties || {});

  const nativeProp = props.some((prop) => prop in HTMLElement.prototype);
  // istanbul ignore if
  if (nativeProp) {
    // eslint-disable-next-line no-console
    console.error(
      `In custom template "${tagName}", "${nativeProp}" is a native HTMLElement property, and should be avoid to be used as a brick property.`
    );
  }

  customElements.define(
    tagName,
    class TplElement extends HTMLElement {
      get $$typeof(): string {
        return "custom-template";
      }

      static get _dev_only_definedProperties(): string[] {
        return props;
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
  if (appId) {
    appRegistered.add(appId);
  }
}
