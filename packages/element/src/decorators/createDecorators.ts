import type {
  AllowedTypeHint,
  AttributeConverter,
  ClassFieldDecoratorContext,
  ClassMethodDecoratorContext,
  DecoratorContext,
  EventDeclaration,
  HasChanged,
  PropertyDeclaration,
} from "./interfaces.js";
import type { NextElement } from "./NextElement.js";

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
  new (...params: any[]): NextElement;
}

export function createDecorators() {
  const observedAttributes = new Set<string>();
  const definedProperties = new Set<string>();
  const definedMethods = new Set<string>();
  const definedEvents = new Set<string>();

  function defineElement(
    name: string,
    options?: {
      styleTexts?: string[];
    }
  ): any {
    return (value: unknown, { kind, addInitializer }: DecoratorContext) => {
      if (process.env.NODE_ENV === "development" && kind !== "class") {
        throw new Error(`Invalid usage of \`@defineElement()\` on a ${kind}`);
      }
      addInitializer(function (this: UpdatingElementConstructor) {
        const superClass = Object.getPrototypeOf(this);

        const mergedAttributes = mergeIterables(
          superClass.observedAttributes ?? [],
          observedAttributes
        );
        Object.defineProperty(this, "observedAttributes", {
          get() {
            return mergedAttributes;
          },
          configurable: true,
        });

        const styleTexts = options?.styleTexts;
        Object.defineProperty(this, "styleTexts", {
          get() {
            return styleTexts;
          },
          configurable: true,
        });

        const mergedProperties = mergeIterables(
          superClass._dev_only_definedProperties ?? [],
          definedProperties
        );

        Object.defineProperty(this, "_dev_only_definedProperties", {
          get() {
            return mergedProperties;
          },
          configurable: true,
        });

        const mergedMethods = mergeIterables(
          superClass._dev_only_definedMethods ?? [],
          definedMethods
        );

        Object.defineProperty(this, "_dev_only_definedMethods", {
          get() {
            return mergedMethods;
          },
          configurable: true,
        });

        const mergedEvents = mergeIterables(
          superClass._dev_only_definedEvents ?? [],
          definedEvents
        );

        Object.defineProperty(this, "_dev_only_definedEvents", {
          get() {
            return mergedEvents;
          },
          configurable: true,
        });

        customElements.define(name, this);
      });
    };
  }

  function property(_options?: PropertyDeclaration): any {
    return function (
      value: unknown,
      {
        kind,
        name,
        static: isStatic,
        private: isPrivate,
      }: ClassFieldDecoratorContext
    ) {
      if (process.env.NODE_ENV === "development") {
        if (kind !== "accessor") {
          throw new Error(`Invalid usage of \`@property()\` on a ${kind}`);
        }
        if (typeof name !== "string") {
          throw new Error(
            `Invalid usage of \`@property()\` on a ${kind} of ${typeof name}`
          );
        }
        if (isStatic) {
          throw new Error(
            `Invalid usage of \`@property()\` on a static ${kind}`
          );
        }
        if (isPrivate) {
          throw new Error(
            `Invalid usage of \`@property()\` on a private ${kind}`
          );
        }
      }
      const options = Object.assign({}, defaultPropertyDeclaration, _options);
      definedProperties.add(name as string);
      const attr = attributeNameForProperty(name as string, options);
      if (attr === undefined) {
        throw new Error("Must reflect to an attribute right now");
      }
      observedAttributes.add(attr);
      return {
        get(this: HTMLElement) {
          return options.converter.fromAttribute(
            this.getAttribute(attr),
            options.type
          );
        },
        set(this: HTMLElement, value: unknown) {
          const oldValue = (this as any)[name as string];
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
          return initialValue;
        },
      };
    };
  }

  function method(): any {
    return function (
      value: unknown,
      {
        kind,
        name,
        static: isStatic,
        private: isPrivate,
      }: ClassMethodDecoratorContext
    ) {
      if (process.env.NODE_ENV === "development") {
        if (kind !== "method") {
          throw new Error(`Invalid usage of \`@method()\` on a ${kind}`);
        }
        if (typeof name !== "string") {
          throw new Error(
            `Invalid usage of \`@method()\` on a ${kind} of ${typeof name}`
          );
        }
        if (isStatic) {
          throw new Error(`Invalid usage of \`@method()\` on a static ${kind}`);
        }
        if (isPrivate) {
          throw new Error(
            `Invalid usage of \`@method()\` on a private ${kind}`
          );
        }
      }
      definedMethods.add(name as string);
    };
  }

  function createEventEmitter<T = void>(
    options: EventDeclaration,
    thisArg: HTMLElement
  ) {
    const { type, ...eventInit } = options;
    definedEvents.add(type);
    return Object.freeze({
      emit: (detail: T): boolean =>
        thisArg.dispatchEvent(new CustomEvent(type, { ...eventInit, detail })),
    });
  }

  return {
    defineElement,
    property,
    method,
    createEventEmitter,
  };
}

function mergeIterables<T>(list1: Iterable<T>, list2: Iterable<T>): T[] {
  const newList = new Set(list1);
  for (const item of list2) {
    newList.add(item);
  }
  return [...newList];
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
