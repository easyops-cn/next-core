import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";

import styleText from "./x-button.shadow.css";

const { defineElement, property, method, createEventEmitter } =
  createDecorators();

@defineElement("basic.x-button", {
  styleTexts: [styleText],
})
class XButton extends ReactNextElement {
  // Track https://github.com/babel/babel/issues/15205
  // @property() accessor label: string | undefined;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  @property() accessor label;

  #clickEvent = createEventEmitter<string>({ type: "oops" }, this);

  @method()
  click() {
    this.#clickEvent.emit("ok");
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
