import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactUpdatingElement } from "@next-core/react-element";

const { defineElement, property, method, createEventEmitter } =
  createDecorators();

@defineElement("x-button")
class XButton extends ReactUpdatingElement {
  // Track https://github.com/babel/babel/issues/15205
  // @property() accessor label: string | undefined;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  @property() accessor label;

  @property() accessor suffix = "!!";

  #clickEvent = createEventEmitter<string>({ type: "oops" }, this);

  @method()
  click() {
    // eslint-disable-next-line no-console
    console.log("click");
    this.#clickEvent.emit("ok");
  }

  protected _renderReact() {
    return (
      <button>
        {this.label}
        <slot />
        {this.suffix}
      </button>
    );
  }
}

export { XButton };
