import React from "react";
import { createDecorators } from "@next-core/element";
import { wrapLocalBrick } from "@next-core/react-element";
import { XButton, XButtonProps } from "../x-button/index.js";
// import "./y-button.css";

import styleText from "./y-button.shadow.css";

export interface YButtonProps extends XButtonProps {
  suffix?: string;
}

const { defineElement, property } = createDecorators();

@defineElement("demo-basic.y-button", {
  styleTexts: [...(XButton.styleTexts as string[]), styleText],
})
class YButton extends XButton {
  // @property() accessor suffix = "!!";
  @property() accessor suffix = "!!";

  render() {
    return (
      <button>
        {this.label}
        <slot />
        {this.suffix}
      </button>
    );
  }
}

export { YButton };

export const WrappedYButton = wrapLocalBrick<YButton, YButtonProps>(YButton);
