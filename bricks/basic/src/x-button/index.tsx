import React from "react";
import { createDecorators, type EventEmitter } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import { http } from "@next-core/brick-http";
import { useTranslation } from "react-i18next";
import styleText from "./x-button.shadow.css";
import "../i18n.js";

const { defineElement, property, method, event } = createDecorators();

@defineElement("basic.x-button", {
  styleTexts: [styleText],
})
class XButton extends ReactNextElement {
  @property() accessor label: string;

  // https://github.com/microsoft/TypeScript/pull/50820
  @event({ type: "oops" }) accessor _clickEvent: EventEmitter<string>;

  @method()
  click() {
    this._clickEvent.emit("ok");
    http.get("/favicon.png").then(
      (res) => {
        // eslint-disable-next-line no-console
        console.log("res:", res);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.log("err:", err);
      }
    );
  }

  render() {
    return <XButtonComponent label={this.label} />;
  }
}

export function XButtonComponent({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <button>
      {t("hello")}
      {label}
      <slot />
    </button>
  );
}

export { XButton };
