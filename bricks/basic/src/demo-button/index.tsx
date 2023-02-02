import React from "react";
import { createDecorators, type EventEmitter } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import styleText from "./demo-button.shadow.css";

const { defineElement, property, method, event } = createDecorators();

@defineElement("basic.demo-button", {
  styleTexts: [styleText],
})
class DemoButton extends ReactNextElement {
  @property() accessor label: string;

  // https://github.com/microsoft/TypeScript/pull/50820
  @event({ type: "oops" }) accessor _clickEvent: EventEmitter<string>;

  @method()
  click() {
    this._clickEvent.emit("ok");
  }

  render() {
    return <ButtonComponent label={this.label} />;
  }
}

export function ButtonComponent({ label }: { label?: string }) {
  return (
    <button>
      {label}
      <slot />
    </button>
  );
}
