import { createDecorators } from "@next-core/element";
import { XButton } from "../x-button/index.js";

const { defineElement, property } = createDecorators();

@defineElement("y-button")
class YButton extends XButton {
  @property()
  test3: string;
}
