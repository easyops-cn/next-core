import { ClassElement } from "./property";

export function method(): any {
  return function decorateProperty(element: ClassElement): ClassElement {
    return { ...element };
  };
}
