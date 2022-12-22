/**
 * 构件事件的选项。
 */
export interface EventDeclaration extends EventInit {
  /**
   * 事件类型名。
   */
  type: string;
}

export type AllowedTypeHint = typeof String | typeof Number | typeof Boolean;

/**
 * Defines options for a property accessor.
 */
export interface PropertyDeclaration<
  Type = unknown,
  TypeHint = AllowedTypeHint
> {
  /**
   * When set to `true`, indicates the property is internal private state. The
   * property should not be set by users. When using TypeScript, this property
   * should be marked as `private` or `protected`, and it is also a common
   * practice to use a leading `_` in the name. The property is not added to
   * `observedAttributes`.
   */
  // readonly state?: boolean;

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
  readonly converter?: AttributeConverter<Type, TypeHint>;

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
  hasChanged?: HasChanged<Type>;
}

export type AttributeReflection = Required<
  Omit<PropertyDeclaration, "attribute">
> & {
  property: string;
};

/**
 * Converts property values to and from attribute values.
 */
export interface AttributeConverter<Type = unknown, TypeHint = unknown> {
  /**
   * Called to convert an attribute value to a property
   * value.
   */
  fromAttribute(value: string | null, type?: TypeHint): Type;

  /**
   * Called to convert a property value to an attribute
   * value.
   *
   * It returns unknown instead of string, to be compatible with
   * https://github.com/WICG/trusted-types (and similar efforts).
   */
  toAttribute(value: Type, type?: TypeHint): unknown;
}

export interface HasChanged<Type = unknown> {
  (value: Type, old: Type): boolean;
}

export interface EventEmitter<T> {
  readonly emit: (detail: T) => boolean;
}
