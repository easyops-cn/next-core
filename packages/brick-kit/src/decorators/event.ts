import { ClassElement } from "./interfaces";
import { warnNativeHtmlElementProperty } from "./utils";

export interface EventOptions extends EventInit {
  /**
   * A string custom event name to override the default.
   */
  type: string;
}

export interface EventEmitter<T = any> {
  emit: (detail?: T) => boolean;
}

function createEvent(
  this: any,
  type: string,
  options?: CustomEventInit
): EventEmitter {
  return {
    emit: <T>(detail: T): boolean => {
      const ev = new CustomEvent(type, { ...options, detail });
      return this.dispatchEvent(ev);
    },
  };
}

export function event(options: EventOptions): any {
  return function decorateProperty(element: ClassElement): ClassElement {
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
      initializer(this: { [key: string]: unknown }) {
        const { type, ...eventInit } = options;
        this[element.key as string] = createEvent.call(this, type, eventInit);
      },
    };
  };
}
