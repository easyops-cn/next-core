import React from "react";
import { createDecorators, type EventEmitter } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import styleText from "./demo-button.shadow.css";

const { defineElement, property, method, event } = createDecorators();

@defineElement("basic.demo-button", {
  styleTexts: [styleText],
})
class DemoButton extends ReactNextElement {
  @property() accessor label: string | undefined;

  // https://github.com/microsoft/TypeScript/pull/50820
  @event({ type: "oops" }) accessor #clickEvent!: EventEmitter<string>;

  @method()
  click() {
    this.#clickEvent.emit("ok");
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
