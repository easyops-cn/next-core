import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import { ReactUseBrick } from "@next-core/react-use-brick";

// import styleText from "./x-button.shadow.css";

const { defineElement, property, method, event } = createDecorators();

@defineElement("demo-basic.button-group", {
  // styleTexts: [styleText],
})
class ButtonGroup extends ReactNextElement {
  render() {
    return <ButtonGroupComponent />;
  }
}

export function ButtonGroupComponent() {
  return (
    <>
      <ReactUseBrick
        useBrick={{
          brick: "demo-basic.x-button",
          properties: {
            label: "Save",
          },
        }}
      />
      <ReactUseBrick
        useBrick={{
          brick: "demo-basic.x-button",
          properties: {
            children: "Cancel",
          },
        }}
      />
    </>
  );
}
