import {
  CustomTemplate,
  CustomTemplateConstructor,
} from "@next-core/brick-types";

class CustomTemplateRegistry {
  readonly #registry = new Map<string, CustomTemplate>();

  define(tagName: string, constructor: CustomTemplateConstructor): void {
    let registered = this.#registry.has(tagName);
    if (registered) {
      // When open launchpad, the storyboard will be updated.
      // However, we can't *undefine* a custom element.
      // Just ignore re-registering custom templates.
      // eslint-disable-next-line no-console
      console.warn(`Custom template of "${tagName}" already registered.`);
    } else {
      registered = !!customElements.get(tagName);
      if (registered) {
        // eslint-disable-next-line no-console
        console.warn(
          `Custom template of "${tagName}" already defined by customElements.`
        );
      }
    }

    // Now we allow re-register custom template
    this.#registry.set(tagName, {
      ...constructor,
      name: tagName,
    });

    const props = getPropsOfCustomTemplate(tagName);

    const nativeProp = props.find((prop) => prop in HTMLElement.prototype);
    // istanbul ignore if
    if (nativeProp !== undefined) {
      throw new Error(
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
  }

  get(tagName: string) {
    return this.#registry.get(tagName);
  }
}

export const customTemplates = new CustomTemplateRegistry();

function getPropsOfCustomTemplate(tagName: string): string[] {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { state, proxy } = customTemplates.get(tagName)!;
  return (state?.map((item) => item.name) ?? []).concat(
    Object.keys(proxy?.properties ?? {})
  );
}

export function getTagNameOfCustomTemplate(
  brick: string,
  appId?: string
): false | string {
  // When a template is registered by an app, it's namespace maybe missed.
  if (!brick.includes(".") && appId) {
    const tagName = `${appId}.${brick}`;
    if (customTemplates.get(tagName)) {
      return tagName;
    }
  }
  if (customTemplates.get(brick)) {
    return brick;
  }
  return false;
}
