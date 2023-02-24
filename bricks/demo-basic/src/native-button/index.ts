import { createDecorators, NextElement } from "@next-core/element";
import { i18n, initializeI18n } from "@next-core/i18n";
import { K, NS, locales } from "./i18n.js";

initializeI18n(NS, locales);

const translate = i18n.getFixedT(null, NS);

const { defineElement } = createDecorators();

@defineElement("demo-basic.native-button")
class NativeButton extends NextElement {
  _render() {
    // eslint-disable-next-line no-console
    console.log("native-button", translate(K.WORKS));
  }
}
