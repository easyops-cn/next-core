import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactUpdatingElement } from "@next-core/react-element";

const { defineElement, property } = createDecorators();

@defineElement("form.f-input")
class FInput extends ReactUpdatingElement {
  @property() accessor label;

  protected _renderReact() {
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
