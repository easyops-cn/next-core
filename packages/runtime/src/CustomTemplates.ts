import { CustomTemplate, CustomTemplateConstructor } from "@next-core/types";

// Note: `prefix` is a native prop on Element, but it's only used in XML documents.
const allowedNativeProps = new Set(["prefix"]);

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

    const nativeProp = props.find(
      (prop) => prop in HTMLElement.prototype && !allowedNativeProps.has(prop)
    );
    // istanbul ignore if
    if (nativeProp !== undefined) {
      throw new Error(
        `In custom template "${tagName}", "${nativeProp}" is a native HTMLElement property, and should be avoid to be used as a brick property.`
      );
    }

    if (registered) {
      return;
    }

    class TplElement extends HTMLElement {
      get $$typeof(): string {
        return "custom-template";
      }

      static get _dev_only_definedProperties(): string[] {
        return getPropsOfCustomTemplate(tagName);
      }

      connectedCallback() {
        let shadowRoot = this.shadowRoot;
        if (!shadowRoot) {
          shadowRoot = this.attachShadow({ mode: "open" });
        }
        const fragment = document.createDocumentFragment();
        const style = document.createElement("style");
        style.textContent = ":host{display:block}:host([hidden]){display:none}";
        const slot = document.createElement("slot");
        fragment.appendChild(style);
        fragment.appendChild(slot);
        shadowRoot.appendChild(fragment);
      }

      disconnectedCallback() {
        if (this.shadowRoot) {
          this.shadowRoot.textContent = "";
        }
      }
    }

    for (const prop of props) {
      Object.defineProperty(TplElement.prototype, prop, {
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }

    customElements.define(tagName, TplElement);
  }

  get(tagName: string) {
    return this.#registry.get(tagName);
  }
}

export const customTemplates = new CustomTemplateRegistry();

function getPropsOfCustomTemplate(tagName: string): string[] {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { state, proxy } = customTemplates.get(tagName)!;
  return (
    state?.filter((item) => item.expose).map((item) => item.name) ?? []
  ).concat(Object.keys(proxy?.properties ?? {}));
}
