import React, { CSSProperties } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import styleText from "./flex-layout.shadow.css";

const { defineElement, property } = createDecorators();

@defineElement("basic.flex-layout", {
  styleTexts: [styleText],
})
class FlexLayout extends ReactNextElement {
  @property() accessor flexDirection:
    | CSSProperties["flexDirection"]
    | undefined;

  @property() accessor justifyContent:
    | CSSProperties["justifyContent"]
    | undefined;

  @property() accessor alignItems: CSSProperties["alignItems"] | undefined;

  @property() accessor alignContent: CSSProperties["alignContent"] | undefined;

  @property() accessor flexWrap: CSSProperties["flexWrap"] | undefined;

  @property() accessor gap: string | undefined;

  render() {
    const flexProps: CSSProperties = {
      flexDirection: this.flexDirection,
      justifyContent: this.justifyContent,
      alignItems: this.alignItems,
      alignContent: this.alignContent,
      flexWrap: this.flexWrap,
      gap: this.gap,
    };

    Object.entries(flexProps).forEach(([key, value]) => {
      if (value != null) {
        this.style[key as "flexDirection"] = value;
      }
    });

    return <slot />;
  }
}

export { FlexLayout };
