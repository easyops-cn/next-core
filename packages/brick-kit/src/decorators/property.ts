// Inspired by [LitElement](https://github.com/Polymer/lit-element)
import { PropertyDeclaration, UpdatingElement } from "../UpdatingElement";
import { ClassElement } from "./interfaces";
import { warnNativeHtmlElementProperty } from "./utils";

// About the (most likely) related version of decorator proposal:
// https://github.com/tc39/proposal-decorators/blob/master/previous/METAPROGRAMMING.md

/**
 * 构件属性装饰器。
 *
 * @example
 *
 * ```ts
 * class MyBrickElement extends UpdatingElement {
 *   @property()
 *   myStringProp: string;
 *
 *   @property({ type: Number })
 *   myNumberProp: number;
 *
 *   @property({ type: Boolean })
 *   myBooleanProperty: boolean;
 *
 *   @property({ attribute: false })
 *   myComplexProperty: MyComplexInterface;
 * }
 * ```
 *
 * @param options 构件属性的选项。
 */
export function property(options?: PropertyDeclaration): any {
  return function decorateProperty(element: ClassElement): ClassElement {
    if (element.kind !== "field" || typeof element.key !== "string") {
      throw new Error(
        "`@property()` only support decorate class string property"
      );
    }
    if (
      typeof element.initializer === "function" &&
      options?.attribute !== false
    ) {
      throw new Error("`@property()` currently not support initialize value");
    }

    warnNativeHtmlElementProperty(element.key, options);

    // createProperty() takes care of defining the property, but we still
    // must return some kind of descriptor, so return a descriptor for an
    // unused prototype field. The finisher calls createProperty().
    return {
      kind: "field",
      key: Symbol(),
      placement: "own",
      descriptor: {},
      initializer(this: { [key: string]: unknown }) {
        if (typeof element.initializer === "function") {
          this[element.key as string] = element.initializer.call(this);
        }
      },
      finisher(Class: typeof UpdatingElement) {
        Class.createProperty(element.key as string, options);
      },
    };
  };
}
