import React from "react";
import { createDecorators } from "@next-core/element";
import { FormItemElement } from "../form-item/FormItemElement.js";
import { Input as InputComponent } from "antd-mobile";

const { defineElement } = createDecorators();

@defineElement("itsc-mobile.general-input", {
  styleTexts: [],
})
class Input extends FormItemElement {
  render() {
    return <InputComponent />;
  }
}

export { Input };
