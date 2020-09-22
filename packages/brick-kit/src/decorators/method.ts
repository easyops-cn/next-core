import { UpdatingElement } from "../UpdatingElement";
import { ClassElement } from "./interfaces";
import { warnNativeHtmlElementProperty } from "./utils";

/**
 * 构件方法装饰器。
 *
 * @example
 *
 * ```ts
 * class MyBrickElement extends UpdatingElement {
 *   @method()
 *   myMethod(): void {
 *     // Do something.
 *   }
 * }
 * ```
 */
export function method(): any {
  return function decorateMethod(element: ClassElement): ClassElement {
    if (element.kind !== "method" || typeof element.key !== "string") {
      throw new Error("`@method()` only support decorate class string method");
    }

    warnNativeHtmlElementProperty(element.key);

    return {
      ...element,
      finisher(Class: typeof UpdatingElement) {
        Class.createMethod(element.key as string);
      },
    };
  };
}
