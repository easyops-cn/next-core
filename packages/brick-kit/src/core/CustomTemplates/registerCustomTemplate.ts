import { CustomTemplateConstructor } from "@next-core/brick-types";
import { removeDeadConditionsInTpl } from "@next-core/brick-utils";
import { getRuntime } from "../../runtime";
import { appRegistered, customTemplateRegistry } from "./constants";

export function registerCustomTemplate(
  tplName: string,
  tplConstructor: CustomTemplateConstructor,
  appId?: string,
  deadCOnditionsRemoved?: boolean
): void {
  let tagName = tplName;
  // When a template is registered by an app, its namespace maybe missed.
  if (appId && !tplName.includes(".")) {
    tagName = `${appId}.${tplName}`;
  }
  let registered = customTemplateRegistry.has(tagName);
  if (registered) {
    // When open launchpad, the storyboard will be updated.
    // However, we can't *undefine* a custom element.
    // Just ignore re-registering custom templates.
    if (!appId || appRegistered.has(appId)) {
      // eslint-disable-next-line no-console
      console.warn(`Custom template of "${tagName}" already registered.`);
    }
  } else {
    registered = !!customElements.get(tagName);
    if (registered) {
      // eslint-disable-next-line no-console
      console.warn(
        `Custom template of "${tagName}" already defined by customElements.`
      );
    }
  }
  if (!deadCOnditionsRemoved && process.env.NODE_ENV !== "test") {
    removeDeadConditionsInTpl(tplConstructor, {
      constantFeatureFlags: true,
      featureFlags: getRuntime().getFeatureFlags(),
    });
  }
  // Now we allow re-register custom template
  customTemplateRegistry.set(tagName, {
    ...tplConstructor,
    name: tagName,
  });

  // Collect defined properties of the template.
  const props = getPropsOfCustomTemplate(tagName);
  const nativeProp = props.find((prop) => prop in HTMLElement.prototype);
  // istanbul ignore if
  if (nativeProp !== undefined) {
    // eslint-disable-next-line no-console
    console.error(
      `In custom template "${tagName}", "${nativeProp}" is a native HTMLElement property, and should be avoid to be used as a brick property.`
    );
  }

  if (registered) {
    return;
  }

  customElements.define(
    tagName,
    class TplElement extends HTMLElement {
      get $$typeof(): string {
        return "custom-template";
      }

      static get _dev_only_definedProperties(): string[] {
        return getPropsOfCustomTemplate(tagName);
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

function getPropsOfCustomTemplate(tagName: string): string[] {
  const { state, proxy } = customTemplateRegistry.get(tagName);
  return (state?.map((item) => item.name) ?? []).concat(
    Object.keys(proxy?.properties ?? {})
  );
}
