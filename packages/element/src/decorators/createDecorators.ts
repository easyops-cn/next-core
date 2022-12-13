import type {
  AllowedTypeHint,
  AttributeConverter,
  ClassDecoratorContext,
  ClassFieldDecoratorContext,
  HasChanged,
  PropertyDeclaration,
} from "./interfaces.js";
import { UpdatingElement } from "./UpdatingElement.js";

const defaultConverter: AttributeConverter = {
  toAttribute(value: unknown, type?: AllowedTypeHint): unknown {
    switch (type) {
      case Boolean:
        return value ? "" : null;
    }
    return value;
  },

  fromAttribute(value: string | null, type?: AllowedTypeHint) {
    switch (type) {
      case Boolean:
        return value !== null;
      case Number:
        return value === null ? null : Number(value);
    }
    return value;
  },
};

/**
 * Change function that returns true if `value` is different from `oldValue`.
 * This method is used as the default for a property's `hasChanged` function.
 */
const notEqual: HasChanged = (value, old): boolean => {
  // This ensures (old==NaN, value==NaN) always returns false
  return old !== value && (old === old || value === value);
};

const defaultPropertyDeclaration: Required<PropertyDeclaration> = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: true,
  hasChanged: notEqual,
};

interface UpdatingElementConstructor {
  new (...params: any[]): UpdatingElement;
}

export function createDecorators() {
  const attributes = new Set<string>();
  // const propertyMap = new Map<string, {
  //   kind: "field";
  //   options: Required<PropertyDeclaration>;
  // }>();

  function defineElement(name: string): any {
    return (
      value: unknown,
      { kind, addInitializer }: ClassDecoratorContext
    ) => {
      if (kind === "class") {
        addInitializer(function (this: UpdatingElementConstructor) {
          const superClass = Object.getPrototypeOf(this);
          const observedAttributes = new Set<string>(
            superClass.observedAttributes ?? []
          );
          for (const attr of attributes) {
            observedAttributes.add(attr);
          }

          // for (const [prop, { kind, options }] of propertyMap.entries()) {
          //   const attr = attributeNameForProperty(prop, options);
          //   if (attr === undefined) {
          //     throw new Error("Must reflect to an attribute now");
          //   }
          //   observedAttributes.add(attr);
          //   console.log("this.prototype === UpdatingElement:", this.prototype === UpdatingElement);
          //   Object.defineProperty(
          //     this.prototype,
          //     prop,
          //     {
          //       get(this: HTMLElement) {
          //         return options.converter.fromAttribute(
          //           this.getAttribute(attr),
          //           options.type
          //         );
          //       },
          //       set(this: HTMLElement, value: unknown) {
          //         const oldValue = (this as any)[prop];
          //         if (options.hasChanged(value, oldValue)) {
          //           const attrValue = options.converter.toAttribute(value, options.type);
          //           if (attrValue === undefined) {
          //             return;
          //           }
          //           if (attrValue === null) {
          //             this.removeAttribute(attr);
          //           } else {
          //             this.setAttribute(attr, attrValue as string);
          //           }
          //         }
          //       },
          //       enumerable: true,
          //       configurable: true,
          //     }
          //   )
          // }

          Object.defineProperty(this, "observedAttributes", {
            get() {
              return [...observedAttributes];
            },
            configurable: true,
          });

          customElements.define(name, this);

          // eslint-disable-next-line no-console
          console.log(name, "attributes:", [...observedAttributes].join(","));
        });
      }
    };
  }

  function property(_options?: PropertyDeclaration): any {
    return function (
      initialValue: unknown,
      { kind, name }: ClassFieldDecoratorContext
    ) {
      const options = Object.assign({}, defaultPropertyDeclaration, _options);
      /* if (kind === "field") {
        propertyMap.set(name as string, {
          kind,
          options: Object.assign({}, defaultPropertyDeclaration, options)
        });
        return initialValue;
      } else */ if (kind === "accessor") {
        const attr = attributeNameForProperty(name, options);
        if (attr === undefined) {
          throw new Error("Must reflect to an attribute now");
        }
        attributes.add(attr);
        return {
          get(this: HTMLElement) {
            return options.converter.fromAttribute(
              this.getAttribute(attr),
              options.type
            );
          },
          set(this: HTMLElement, value: unknown) {
            const oldValue = (this as any)[name];
            if (options.hasChanged(value, oldValue)) {
              const attrValue = options.converter.toAttribute(
                value,
                options.type
              );
              if (attrValue === undefined) {
                return;
              }
              if (attrValue === null) {
                this.removeAttribute(attr);
              } else {
                this.setAttribute(attr, attrValue as string);
              }
            }
          },
          init(this: any, initialValue: unknown) {
            // eslint-disable-next-line no-console
            console.log("init:", name, initialValue);
            this[name] = initialValue;
          },
        };
      }
    };
  }

  return {
    defineElement,
    property,
  };
}

function attributeNameForProperty(
  name: PropertyKey,
  options: PropertyDeclaration
): string | undefined {
  const attribute = options.attribute;
  return attribute === false
    ? undefined
    : typeof attribute === "string"
    ? attribute
    : typeof name === "string"
    ? name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
    : undefined;
}
