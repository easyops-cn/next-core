import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import { ReactUseBrick } from "@next-core/react-runtime";
import { UseSingleBrickConf } from "@next-core/types";
import { WrappedXButton } from "../x-button/index.js";
import { WrappedYButton } from "../y-button/index.js";

// import styleText from "./x-button.shadow.css";

const { defineElement, property, method, event } = createDecorators();

@defineElement("demo-basic.button-group", {
  // styleTexts: [styleText],
  shadowOptions: false,
})
class ButtonGroup extends ReactNextElement {
  @property({ attribute: false })
  accessor useBrick: UseSingleBrickConf;

  @property({ attribute: false })
  accessor datum: unknown;

  render() {
    return <ButtonGroupComponent useBrick={this.useBrick} data={this.datum} />;
  }
}

export function ButtonGroupComponent({
  useBrick,
  data,
}: {
  useBrick: UseSingleBrickConf;
  data: unknown;
}) {
  return (
    <>
      {/* <WrappedXButton
        label="I am label X,"
        ref={(element) => {
          // eslint-disable-next-line no-console
          console.log("ref x", element);
        }}
      >
        I am content X.
      </WrappedXButton>
      <WrappedYButton
        label="I am label Y,"
        suffix="$$"
        ref={(element) => {
          // eslint-disable-next-line no-console
          console.log("ref y", element);
        }}
      >
        I am content Y.
      </WrappedYButton> */}
      {useBrick && <ReactUseBrick useBrick={useBrick} data={data} />}
      {/* {useBrick && <ReactUseBrick useBrick={useBrick} data="b" />} */}
    </>
  );
}
