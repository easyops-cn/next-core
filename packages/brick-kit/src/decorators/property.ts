// Inspired by [LitElement](https://github.com/Polymer/lit-element)

import { PropertyDeclaration, UpdatingElement } from "../UpdatingElement";

// From the TC39 Decorators proposal
interface ClassElement {
  kind: "field" | "method";
  key: PropertyKey;
  placement: "static" | "prototype" | "own";
  initializer?: Function;
  extras?: ClassElement[];
  finisher?: (Class: any) => void;
  descriptor?: PropertyDescriptor;
}

export function property(options?: PropertyDeclaration): any {
  return function decorateProperty(element: ClassElement): ClassElement {
    if (element.kind !== "field" || typeof element.key !== "string") {
      throw new Error(
        "`@property()` only support decorate class string property"
      );
    }
    if (
      typeof element.initializer === "function" &&
      !(options && options.attribute === false)
    ) {
      throw new Error("`@property()` currently not support initialize value");
    }
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
      }
    };
  };
}
