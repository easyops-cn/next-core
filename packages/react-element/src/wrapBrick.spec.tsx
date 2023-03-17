import React, { createRef } from "react";
import { describe, test, expect } from "@jest/globals";
import { render } from "@testing-library/react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "./ReactNextElement.js";
import { wrapBrick, wrapLocalBrick } from "./wrapBrick.jsx";

interface MyButtonProps {
  type?: "primary" | "default";
}

const { defineElement, property } = createDecorators();
@defineElement("my-button")
class MyButton extends ReactNextElement implements MyButtonProps {
  @property() accessor type: "primary" | "default" | undefined;

  render() {
    return (
      <button>
        {this.type}:<slot />
      </button>
    );
  }
}

describe("wrapLocalBrick", () => {
  test("basic", () => {
    const WrappedButton = wrapLocalBrick<MyButton, MyButtonProps>(MyButton);
    const ref = createRef<MyButton>();
    const { container } = render(
      <WrappedButton type="primary" ref={ref}>
        ok
      </WrappedButton>
    );
    const myButton = container.querySelector("my-button");
    expect(myButton?.shadowRoot?.textContent).toBe("primary:");
    expect(myButton?.textContent).toBe("ok");
    expect(ref.current?.type).toBe("primary");
    expect(ref.current?.constructor).toBe(MyButton);
  });
});

describe("wrapBrick", () => {
  test("basic", () => {
    const WrappedButton = wrapBrick<MyButton, MyButtonProps>("my-button");
    const ref = createRef<MyButton>();
    const { container } = render(
      <WrappedButton type="primary" ref={ref}>
        ok
      </WrappedButton>
    );
    const myButton = container.querySelector("my-button");
    expect(myButton?.shadowRoot?.textContent).toBe("primary:");
    expect(myButton?.textContent).toBe("ok");
    expect(ref.current?.type).toBe("primary");
    expect(ref.current?.constructor).toBe(MyButton);
  });
});
