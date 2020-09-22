import { UpdatingElement, EventDeclaration } from "../UpdatingElement";
import { ClassElement } from "./interfaces";
import { warnNativeHtmlElementProperty } from "./utils";

/**
 * 构件事件装饰器。
 *
 * @example
 *
 * ```ts
 * class MyBrickElement extends UpdatingElement {
 *   @event({
 *     type: "my-brick.my-event",
 *   })
 *   private _myEventEmitter: EventEmitter<number>;
 *
 *   private _triggerMyEvent = (): void => {
 *     this._myEventEmitter.emit(123);
 *   };
 * }
 * ```
 *
 * @param options 构件事件的选项。
 */
export function event(options: EventDeclaration): any {
  return function decorateEvent(element: ClassElement): ClassElement {
    if (element.kind !== "field" || typeof element.key !== "string") {
      throw new Error("`@event()` only support decorate class string property");
    }

    if (typeof element.initializer === "function") {
      throw new Error("`@event()` currently not support initialize value");
    }

    warnNativeHtmlElementProperty(element.key);

    return {
      kind: "field",
      key: Symbol(),
      placement: "own",
      descriptor: {},
      finisher(Class: typeof UpdatingElement) {
        Class.createEventEmitter(element.key as string, options);
      },
    };
  };
}
