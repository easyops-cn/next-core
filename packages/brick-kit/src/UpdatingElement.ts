// Inspired by [LitElement](https://github.com/Polymer/lit-element)

export type TypeHint = typeof String | typeof Number | typeof Boolean;

/**
 * Converts property values to and from attribute values.
 */
export interface ComplexAttributeConverter<Type = unknown> {
  /**
   * Function called to convert an attribute value to a property
   * value.
   */
  fromAttribute?(value: string | null, type?: TypeHint): Type;

  /**
   * Function called to convert a property value to an attribute
   * value.
   *
   * It returns unknown instead of string, to be compatible with
   * https://github.com/WICG/trusted-types (and similar efforts).
   */
  toAttribute?(value: Type, type?: TypeHint): unknown;
}

/**
 * Defines options for a property accessor.
 */
export interface PropertyDeclaration<Type = unknown> {
  /**
   * Indicates how and whether the property becomes an observed attribute.
   * If the value is `false`, the property is not added to `observedAttributes`.
   * If true or absent, the lowercased property name is observed (e.g. `fooBar`
   * becomes `foobar`). If a string, the string value is observed (e.g
   * `attribute: 'foo-bar'`).
   */
  readonly attribute?: boolean | string;

  /**
   * Indicates the type of the property. This is used only as a hint for the
   * `converter` to determine how to convert the attribute
   * to/from a property.
   */
  readonly type?: TypeHint;

  /**
   * Indicates how to convert the attribute to/from a property. If this value
   * is a function, it is used to convert the attribute value a the property
   * value. If it's an object, it can have keys for `fromAttribute` and
   * `toAttribute`. If no `toAttribute` function is provided and
   * `reflect` is set to `true`, the property value is set directly to the
   * attribute. A default `converter` is used if none is provided; it supports
   * `Boolean`, `String`, `Number`, `Object`, and `Array`. Note,
   * when a property changes and the converter is used to update the attribute,
   * the property is never updated again as a result of the attribute changing,
   * and vice versa.
   */
  readonly converter?: ComplexAttributeConverter<Type>;

  /**
   * Indicates if the property should reflect to an attribute.
   * If `true`, when the property is set, the attribute is set using the
   * attribute name determined according to the rules for the `attribute`
   * property option and the value of the property converted using the rules
   * from the `converter` property option.
   */
  readonly reflect?: boolean;

  /**
   * A function that indicates if a property should be considered changed when
   * it is set. The function should take the `newValue` and `oldValue` and
   * return `true` if an update should be requested.
   */
  hasChanged?(value: Type, oldValue: Type): boolean;

  /**
   * Indicates whether an accessor will be created for this property. By
   * default, an accessor will be generated for this property that requests an
   * update when set. If this flag is `true`, no accessor will be created, and
   * it will be the user's responsibility to call
   * `this.requestUpdate(propertyName, oldValue)` to request an update when
   * the property changes.
   */
  readonly noAccessor?: boolean;
}

/**
 * Map of properties to PropertyDeclaration options. For each property an
 * accessor is made, and the property is processed according to the
 * PropertyDeclaration options.
 */
export interface PropertyDeclarations {
  readonly [key: string]: PropertyDeclaration;
}

export type PropertyValues = Map<PropertyKey, unknown>;

export const defaultConverter: ComplexAttributeConverter = {
  toAttribute(value: unknown, type?: TypeHint): unknown {
    switch (type) {
      case Boolean:
        return value ? "" : null;
    }
    return value;
  },

  fromAttribute(value: string | null, type?: TypeHint) {
    switch (type) {
      case Boolean:
        return value !== null;
      case Number:
        return value === null ? null : Number(value);
    }
    return value;
  }
};

export interface HasChanged {
  (value: unknown, old: unknown): boolean;
}

/**
 * Change function that returns true if `value` is different from `oldValue`.
 * This method is used as the default for a property's `hasChanged` function.
 */
export const notEqual: HasChanged = (value: unknown, old: unknown): boolean => {
  // This ensures (old==NaN, value==NaN) always returns false
  return old !== value && (old === old || value === value);
};

const defaultPropertyDeclaration: PropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: true,
  hasChanged: notEqual
};

function attributeNameForProperty(
  name: PropertyKey,
  options: PropertyDeclaration
): string {
  const attribute = options.attribute;
  return attribute === false
    ? undefined
    : typeof attribute === "string"
    ? attribute
    : typeof name === "string"
    ? name.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)
    : undefined;
}

export abstract class UpdatingElement extends HTMLElement {
  private _hasRequestedRender = false;
  private static _observedAttributes = new Set<string>();

  static get observedAttributes(): string[] {
    this._ensureObservedAttributes();
    return Array.from(this._observedAttributes);
  }

  attributeChangedCallback(
    name: string,
    old: string | null,
    value: string | null
  ): void {
    if (old !== value) {
      this._enqueueRender();
    }
  }

  // Enure multiple property settings will trigger rendering only once.
  private _enqueueRender(): void {
    // If the element is not connected,
    // let `connectedCallback()` do the job of rendering.
    if (this.isConnected && !this._hasRequestedRender) {
      this._hasRequestedRender = true;
      Promise.resolve().then(() => {
        this._hasRequestedRender = false;
        this._render();
      });
    }
  }

  private static _ensureObservedAttributes(): void {
    // eslint-disable-next-line no-prototype-builtins
    if (!this.hasOwnProperty("_observedAttributes")) {
      const superClass = Object.getPrototypeOf(this);
      this._observedAttributes = new Set<string>(
        // eslint-disable-next-line no-prototype-builtins
        superClass.hasOwnProperty("_observedAttributes")
          ? superClass._observedAttributes
          : null
      );
    }
  }

  static createProperty(name: string, options?: PropertyDeclaration): void {
    this._ensureObservedAttributes();

    options = Object.assign({}, defaultPropertyDeclaration, options);

    // eslint-disable-next-line no-prototype-builtins
    if (options.noAccessor || this.prototype.hasOwnProperty(name)) {
      return;
    }

    const attr = attributeNameForProperty(name, options);

    if (attr === undefined) {
      const key = `__${name}`;
      Object.defineProperty(this.prototype, name, {
        get(): any {
          return (this as any)[key];
        },
        set(this: UpdatingElement, value: unknown) {
          const oldValue = (this as any)[name];
          if (options.hasChanged(value, oldValue)) {
            (this as any)[key] = value;
            this._enqueueRender();
          }
        }
      });
      return;
    }

    this._observedAttributes.add(attr);

    Object.defineProperty(this.prototype, name, {
      // tslint:disable-next-line:no-any no symbol in index
      get(): any {
        return options.converter.fromAttribute(
          (this as HTMLElement).getAttribute(attr),
          options.type
        );
      },
      set(this: UpdatingElement, value: unknown) {
        const oldValue = (this as any)[name];
        if (options.hasChanged(value, oldValue)) {
          const attrValue = options.converter.toAttribute(value, options.type);
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
      configurable: true,
      enumerable: true
    });
  }

  protected abstract _render(): void;
}
