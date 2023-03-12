import type {
  ContextConf,
  CustomTemplate,
  CustomTemplateConstructor,
  CustomTemplateProxyBasicProperty,
} from "@next-core/types";
import { uniq } from "lodash";
import { RuntimeBrickElement } from "./internal/interfaces.js";

// Note: `prefix` is a native prop on Element, but it's only used in XML documents.
const allowedNativeProps = new Set(["prefix"]);

interface LegacyTplPropProxy extends CustomTemplateProxyBasicProperty {
  asVariable?: boolean;
  mergeProperty?: unknown;
  refTransform?: unknown;
}

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

    // Transform legacy `proxy.properties[].asVariable` as states.
    const proxyProperties = (constructor.proxy?.properties ?? {}) as {
      [name: string]: LegacyTplPropProxy;
    };
    const validProxyProps: [string, CustomTemplateProxyBasicProperty][] = [];
    const legacyTplVariables: string[] = [];
    for (const [key, value] of Object.entries(proxyProperties ?? {})) {
      if (value.asVariable) {
        // For existed TPL usage, treat it as a STATE.
        legacyTplVariables.push(key);
        // eslint-disable-next-line no-console
        console.warn(
          "Template `asVariable` with `TPL.*` is deprecated and will be dropped in v3:",
          tagName,
          key
        );
      } else if (value.mergeProperty || value.refTransform) {
        // eslint-disable-next-line no-console
        console.error(
          "Template `mergeProperty` and `refTransform` are not supported in v3:",
          tagName,
          key
        );
      } else if (value.ref) {
        validProxyProps.push([key, value]);
      }
      // Else: documentation only, for exposed states.
    }

    const compatibleConstructor = {
      ...constructor,
      proxy: {
        ...constructor.proxy,
        properties: Object.fromEntries(validProxyProps),
      },
      state: (constructor.state
        ? constructor.state.map((item) => ({
            // For existed templates, make `expose` defaults to true.
            expose: true,
            ...item,
          }))
        : []
      ).concat(legacyTplVariables.map((tpl) => ({ name: tpl, expose: true }))),
    };

    // Now we allow re-register custom template
    this.#registry.set(tagName, {
      ...compatibleConstructor,
      name: tagName,
    });

    const exposedStates = getExposedStates(compatibleConstructor.state);
    const proxyMethods = Object.entries(
      compatibleConstructor.proxy?.methods ?? {}
    );

    const props = exposedStates.concat(
      validProxyProps.map((entry) => entry[0]),
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
      if (validProxyProps.some((entry) => entry[0] === propName)) {
        // eslint-disable-next-line no-console
        console.error(
          `Cannot define an exposed state that is also a proxy property: "${propName}" in ${tagName}`
        );
        continue;
      }
      Object.defineProperty(TplElement.prototype, propName, {
        get(this: RuntimeBrickElement) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return this.$$tplStateStore!.getValue(propName);
        },
        set(this: RuntimeBrickElement, value: unknown) {
          // 在 mount 过程中，先设置属性，再设置 `$$tplStateStore`，这样，当触发属性设置时，
          // 避免初始化的一次 state update 操作及其 onChange 事件。
          this.$$tplStateStore?.updateValue(propName, value, "replace");
        },
        enumerable: true,
      });
    }

    for (const [from, to] of validProxyProps) {
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
          // 同上 exposedState.set
          const element = this.$$getElementByRef?.(to.ref) as unknown as Record<
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
