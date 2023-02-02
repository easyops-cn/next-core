import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";

const { defineElement, property } = createDecorators();

@defineElement("demo-form.f-input")
class FInput extends ReactNextElement {
  @property() accessor label: string;

  render() {
    return (
      <div>
        <label>
          <span>{this.label}: </span>
          <input placeholder="It works" />
        </label>
      </div>
    );
  }
}
