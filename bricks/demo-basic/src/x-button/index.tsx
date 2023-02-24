import React from "react";
import { createDecorators, type EventEmitter } from "@next-core/element";
import { ReactNextElement, wrapLocalBrick } from "@next-core/react-element";
import styleText from "./x-button.shadow.css";

const { defineElement, property, method, event } = createDecorators();

export interface XButtonProps {
  label?: string;
}

@defineElement("demo-basic.x-button", {
  styleTexts: [styleText],
})
class XButton extends ReactNextElement implements XButtonProps {
  @property() accessor label: string;

  // https://github.com/microsoft/TypeScript/pull/50820
  @event({ type: "oops" }) accessor #clickEvent: EventEmitter<string>;

  @method()
  triggerClick() {
    this.#clickEvent.emit("ok");
  }

  render() {
    return <XButtonComponent label={this.label} />;
  }
}

export function XButtonComponent({ label }: { label?: string }) {
  return (
    <button>
      Hello,
      {label}
      <slot />
    </button>
  );
}

export { XButton };

export const WrappedXButton = wrapLocalBrick<XButton, XButtonProps>(XButton);
