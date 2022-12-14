import { createDecorators } from "@next-core/element";
import { XButton } from "../x-button/index.js";
import "./y-button.css";

const { defineElement, property } = createDecorators();

@defineElement("basic.y-button")
class YButton extends XButton {
  // @property() accessor suffix: string | undefined;
  // @property() accessor suffix
}
