import type {
  ContextConf,
  CustomTemplate,
  CustomTemplateConstructor,
} from "@next-core/types";
import { uniq } from "lodash";
import { RuntimeBrickElement } from "./internal/interfaces.js";

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

    const { state, proxy } = constructor;
    const exposedStates = getExposedStates(state);
    const proxyProps = Object.entries(proxy?.properties ?? {});
    const proxyMethods = Object.entries(proxy?.methods ?? {});

    const props = exposedStates.concat(
      proxyProps.filter((entry) => entry[1].ref).map((entry) => entry[0]),
      proxyMethods.map((entry) => entry[0])
    );

    const nativeProp = props.find(
      (prop) => prop in HTMLElement.prototype && !allowedNativeProps.has(prop)
    );
    // istanbul ignore if
    if (nativeProp !== undefined) {
      throw new Error(
        `In custom template "${tagName}", "${nativeProp}" is a native HTMLElement property, and should be avoid to be used as a brick property or method.`
      );
    }

    if (registered) {
      return;
    }

    class TplElement extends HTMLElement {
      get $$typeof() {
        return "custom-template" as const;
      }

      static get _dev_only_definedProperties(): string[] {
        return props;
      }

      $$getElementByRef(this: RuntimeBrickElement, ref: string) {
        return this.$$tplStateStore?.hostBrick?.tplHostMetadata?.internalBricksByRef.get(
          ref
        )?.element;
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

    for (const propName of exposedStates) {
      Object.defineProperty(TplElement.prototype, propName, {
        get(this: RuntimeBrickElement) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return this.$$tplStateStore!.getValue(propName);
        },
        set(this: RuntimeBrickElement, value: unknown) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.$$tplStateStore?.updateValue(propName, value, "replace");
        },
        enumerable: true,
      });
    }

    for (const [from, to] of proxyProps) {
      Object.defineProperty(TplElement.prototype, from, {
        get(this: TplElement) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const element = this.$$getElementByRef!(to.ref) as unknown as Record<
            string,
            unknown
          >;
          return element[to.refProperty ?? from];
        },
        set(this: TplElement, value: unknown) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const element = this.$$getElementByRef!(to.ref) as unknown as Record<
            string,
            unknown
          >;
          if (element) {
            element[to.refProperty ?? from] = value;
          }
        },
        enumerable: true,
      });
    }

    for (const [from, to] of proxyMethods) {
      Object.defineProperty(TplElement.prototype, from, {
        value(this: TplElement, ...args: unknown[]) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const element = this.$$getElementByRef!(to.ref) as unknown as Record<
            string,
            Function
          >;
          element[to.refMethod ?? from](...args);
        },
        enumerable: true,
      });
    }

    customElements.define(tagName, TplElement);
  }

  get(tagName: string) {
    return this.#registry.get(tagName);
  }
}

export const customTemplates = new CustomTemplateRegistry();

function getExposedStates(state: ContextConf[] | undefined): string[] {
  // Allow duplicated state names which maybe mutually exclusive.
  return uniq(
    state?.filter((item) => item.expose).map((item) => item.name) ?? []
  );
}
