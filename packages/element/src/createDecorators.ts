import type {
  AllowedTypeHint,
  AttributeConverter,
  AttributeReflection,
  EventDeclaration,
  EventEmitter,
  HasChanged,
  PropertyDeclaration,
} from "./interfaces.js";
import { NextElement } from "./NextElement.js";
import {
  symbolOfAttributeHasBeenSet,
  symbolOfStopAttributeChangedCallback,
} from "./internal/symbols.js";

interface Constructable<T> {
  new (): T;
}

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
        return value !== null && value !== "false";
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

export function createDecorators() {
  const attributeReflections = new Map<string, AttributeReflection>();
  const definedProperties = new Set<string>();
  const definedMethods = new Set<string>();
  const definedEvents = new Set<string>();

  function defineElement(
    name: string,
    options?: {
      styleTexts?: string[];
    }
  ) {
    return (
      value: Function,
      {
        kind,
        name: className,
        addInitializer,
      }: ClassDecoratorContext<Constructable<NextElement>>
    ) => {
      // istanbul ignore next
      if (process.env.NODE_ENV === "development" && kind !== "class") {
        throw new Error(
          `Invalid usage of \`@defineElement()\` on a ${kind}: "${className}"`
        );
      }
      addInitializer(function (this) {
        const superClass = Object.getPrototypeOf(this);

        const mergedAttributes = mergeIterables(
          superClass.observedAttributes ?? [],
          attributeReflections.keys()
        );
        defineReadonlyProperty(this, "observedAttributes", mergedAttributes);

        const mergedAttributeReflections = new Map([
          ...(superClass.__attributeReflections ?? []),
          ...attributeReflections,
        ]);
        defineReadonlyProperty(
          this,
          "__attributeReflections",
          mergedAttributeReflections
        );

        defineReadonlyProperty(this, "styleTexts", options?.styleTexts);

        const mergedProperties = mergeIterables(
          superClass._dev_only_definedProperties ?? [],
          definedProperties
        );
        defineReadonlyProperty(
          this,
          "_dev_only_definedProperties",
          mergedProperties
        );

        const mergedMethods = mergeIterables(
          superClass._dev_only_definedMethods ?? [],
          definedMethods
        );
        defineReadonlyProperty(this, "_dev_only_definedMethods", mergedMethods);

        const mergedEvents = mergeIterables(
          superClass._dev_only_definedEvents ?? [],
          definedEvents
        );
        defineReadonlyProperty(this, "_dev_only_definedEvents", mergedEvents);

        customElements.define(name, this);
      });
    };
  }

  function property<T>(options?: PropertyDeclaration) {
    return function (
      { get, set }: ClassAccessorDecoratorTarget<NextElement, T>,
      {
        kind,
        name,
        static: isStatic,
        private: isPrivate,
      }: ClassAccessorDecoratorContext<NextElement, T>
    ): ClassAccessorDecoratorResult<NextElement, T> {
      // istanbul ignore next
      if (process.env.NODE_ENV === "development") {
        if (kind !== "accessor") {
          throw new Error(
            `Invalid usage of \`@property()\` on a ${kind}: "${String(name)}"`
          );
        }
        if (typeof name !== "string") {
          throw new Error(
            `Invalid usage of \`@property()\` on a ${kind} of ${typeof name}`
          );
        }
        if (isStatic) {
          throw new Error(
            `Invalid usage of \`@property()\` on a static ${kind}: "${name}"`
          );
        }
        if (isPrivate) {
          throw new Error(
            `Invalid usage of \`@property()\` on a private ${kind}: "${name}"`
          );
        }
      }
      definedProperties.add(name as string);
      const _options = Object.assign({}, defaultPropertyDeclaration, options);
      const attrName = attributeNameForProperty(name as string, _options);
      if (attrName !== undefined) {
        attributeReflections.set(attrName, {
          ..._options,
          property: name as string,
        });
      }
      return {
        get(this) {
          // If the attribute has been set (not by initialization), returns the
          // value converted by the attribute. Otherwise returns the prop value.
          // This works as a type conversion when reading a prop value.
          if (
            attrName !== undefined &&
            this[symbolOfAttributeHasBeenSet](attrName)
          ) {
            return _options.converter.fromAttribute(
              this.getAttribute(attrName),
              _options.type
            ) as T;
          }
          return get.call(this);
        },
        set(this, value) {
          const oldValue = get.call(this);
          set.call(this, value);
          if (_options.hasChanged(value, oldValue)) {
            if (attrName !== undefined) {
              const attrValue = _options.converter.toAttribute(
                value,
                _options.type
              );
              this[symbolOfStopAttributeChangedCallback](true);
              if (attrValue == null) {
                this.removeAttribute(attrName);
              } else {
                this.setAttribute(attrName, attrValue as string);
              }
              this[symbolOfStopAttributeChangedCallback](false);
            }
            this._requestRender();
          }
        },
        init(this, initialValue) {
          if (
            attrName !== undefined &&
            _options.hasChanged(initialValue, undefined)
          ) {
            const attrValue = _options.converter.toAttribute(
              initialValue,
              _options.type
            );
            if (attrValue != null) {
              // No attributes should be created during constructing custom elements.
              // This is true even if the work is done inside a constructor-initiated microtask.
              // https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-conformance
              requestAnimationFrame(() => {
                if (!this[symbolOfAttributeHasBeenSet](attrName)) {
                  this[symbolOfStopAttributeChangedCallback](true);
                  this.setAttribute(attrName, attrValue as string);
                  this[symbolOfStopAttributeChangedCallback](false);
                }
              });
            }
          }
          return initialValue;
        },
      };
    };
  }

  function method() {
    return function (
      value: Function,
      {
        kind,
        name,
        static: isStatic,
        private: isPrivate,
      }: ClassMethodDecoratorContext
    ) {
      // istanbul ignore next
      if (process.env.NODE_ENV === "development") {
        if (kind !== "method") {
          throw new Error(
            `Invalid usage of \`@method()\` on a ${kind}: "${String(name)}"`
          );
        }
        if (typeof name !== "string") {
          throw new Error(
            `Invalid usage of \`@method()\` on a ${kind} of ${typeof name}`
          );
        }
        if (isStatic) {
          throw new Error(
            `Invalid usage of \`@method()\` on a static ${kind}: "${name}"`
          );
        }
        if (isPrivate) {
          throw new Error(
            `Invalid usage of \`@method()\` on a private ${kind}: "${name}"`
          );
        }
      }
      definedMethods.add(name as string);
    };
  }

  function event<T>(options: EventDeclaration) {
    return function (
      { get }: ClassAccessorDecoratorTarget<NextElement, EventEmitter<T>>,
      {
        kind,
        name,
        static: isStatic,
        private: isPrivate,
      }: ClassAccessorDecoratorContext
    ): ClassAccessorDecoratorResult<NextElement, EventEmitter<T>> {
      // istanbul ignore next
      if (process.env.NODE_ENV === "development") {
        if (kind !== "accessor") {
          throw new Error(
            `Invalid usage of \`@event()\` on a ${kind}: "${String(name)}"`
          );
        }
        if (!isPrivate) {
          throw new Error(
            `Invalid usage of \`@event()\` on a non-private ${kind}: "${String(
              name
            )}"`
          );
        }
        if (isStatic) {
          throw new Error(
            `Invalid usage of \`@event()\` on a static ${kind}: "${String(
              name
            )}"`
          );
        }
      }
      const { type, ...eventInit } = options;
      definedEvents.add(type);
      return {
        get(this) {
          return get.call(this);
        },
        set() {
          throw new Error("Decorated events are readonly");
        },
        init(this, initialValue) {
          // istanbul ignore next
          if (
            process.env.NODE_ENV === "development" &&
            initialValue !== undefined
          ) {
            throw new Error(
              `Do not set an initial value for a decorated event: "${String(
                name
              )}"`
            );
          }
          return Object.freeze({
            emit: (detail: T): boolean =>
              this.dispatchEvent(
                new CustomEvent(type, { ...eventInit, detail })
              ),
          });
        },
      };
    };
  }

  return {
    defineElement,
    property,
    method,
    event,
  };
}

function defineReadonlyProperty(
  target: unknown,
  propName: string,
  propValue: unknown
): void {
  Object.defineProperty(target, propName, {
    get() {
      return propValue;
    },
    configurable: true,
  });
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
