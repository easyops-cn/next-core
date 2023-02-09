import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import { ReactUseBrick } from "@next-core/react-runtime";
import { UseSingleBrickConf } from "@next-core/brick-types";

// import styleText from "./x-button.shadow.css";

const { defineElement, property, method, event } = createDecorators();

@defineElement("demo-basic.button-group", {
  // styleTexts: [styleText],
})
class ButtonGroup extends ReactNextElement {
  @property({ attribute: false })
  accessor useBrick: UseSingleBrickConf;

  render() {
    return <ButtonGroupComponent useBrick={this.useBrick} />;
  }
}

export function ButtonGroupComponent({
  useBrick,
}: {
  useBrick: UseSingleBrickConf;
}) {
  return (
    <>
      <ReactUseBrick useBrick={useBrick} data="a" />
      <ReactUseBrick useBrick={useBrick} data="b" />
    </>
  );
}
