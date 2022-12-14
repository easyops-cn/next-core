import React from "react";
import { createDecorators } from "@next-core/element";
import { XButton } from "../x-button/index.js";
import "./y-button.css";

import styleText from "./y-button.shadow.css";

const { defineElement, property } = createDecorators();

@defineElement("basic.y-button", {
  styleTexts: [...(XButton.styleTexts as string[]), styleText],
})
class YButton extends XButton {
  // @property() accessor suffix: string | undefined;
  @property() accessor suffix = "!!";

  protected render() {
    return (
      <button>
        {this.label}
        <slot />
        {this.suffix}
      </button>
    );
  }
}
