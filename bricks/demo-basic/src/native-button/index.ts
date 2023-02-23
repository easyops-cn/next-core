import { createDecorators, NextElement } from "@next-core/element";
import { initializeI18n } from "@next-core/i18n/basic";

initializeI18n();

const { defineElement } = createDecorators();

@defineElement("demo-basic.native-button")
class NativeButton extends NextElement {
  _render() {
    // eslint-disable-next-line no-console
    console.log("native-button works");
  }
}
