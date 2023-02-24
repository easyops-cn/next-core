import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import { useTranslation, initializeReactI18n } from "@next-core/i18n/react";
import { K, NS, locales } from "./i18n.js";

initializeReactI18n(NS, locales);

const { defineElement } = createDecorators();

@defineElement("demo-basic.say-hello")
class SayHello extends ReactNextElement {
  render() {
    return <SayHelloComponent />;
  }
}

export function SayHelloComponent() {
  const { t } = useTranslation(NS);
  return (
    <div>
      {t(K.HELLO)},{t(K.WORLD)}
    </div>
  );
}

export { SayHello };
