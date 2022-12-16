import React from "react";
import { createDecorators, type EventEmitter } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";

import styleText from "./x-button.shadow.css";

const { defineElement, property, method, event } = createDecorators();

@defineElement("basic.x-button", {
  styleTexts: [styleText],
})
class XButton extends ReactNextElement {
  // Track https://github.com/babel/babel/issues/15205
  // @property() accessor label: string | undefined;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  @property() accessor label;

  // https://github.com/microsoft/TypeScript/pull/50820
  @event({ type: "oops" }) // accessor _clickEvent: EventEmitter<string> | undefined;
  accessor // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  _clickEvent;

  @method()
  click() {
    this._clickEvent.emit("ok");
  }

  render() {
    return (
      <button>
        {this.label}
        <slot />
      </button>
    );
  }
}

export { XButton };
