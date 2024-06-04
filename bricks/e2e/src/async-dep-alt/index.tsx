import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";

const { defineElement } = createDecorators();

export
@defineElement("e2e.async-dep-alt")
class AsyncDepAlt extends ReactNextElement {
  render() {
    return <p>Async Dependency Alternative</p>;
  }
}
