import React, { createRef } from "react";
import { describe, test, expect } from "@jest/globals";
import { render } from "@testing-library/react";
import { EventEmitter, createDecorators } from "@next-core/element";
import { ReactNextElement } from "./ReactNextElement.js";
import { wrapBrick, wrapLocalBrick } from "./wrapBrick.jsx";

interface MyButtonProps {
  type?: "primary" | "default";
}

interface MyButtonEvents {
  "button.click": CustomEvent<string | undefined>;
}

interface MyButtonEventsMapping {
  onButtonClick: "button.click";
}

const { defineElement, property, event } = createDecorators();
@defineElement("my-button")
class MyButton extends ReactNextElement implements MyButtonProps {
  @property() accessor type: "primary" | "default" | undefined;

  @event({ type: "button.click" }) accessor #buttonClick!: EventEmitter<
    string | undefined
  >;

  #handleClick = () => {
    this.#buttonClick.emit(this.type);
  };

  render() {
    return (
      <button onClick={this.#handleClick}>
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

  test("pass brick name", () => {
    const WrappedButton = wrapLocalBrick<MyButton, MyButtonProps>("my-button");
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

  test("with events mapping", () => {
    const WrappedButton = wrapBrick<
      MyButton,
      MyButtonProps,
      MyButtonEvents,
      MyButtonEventsMapping
    >("my-button", {
      onButtonClick: "button.click",
    });
    const ref = createRef<MyButton>();
    const onButtonClick = jest.fn();
    const { container } = render(
      <WrappedButton type="default" ref={ref} onButtonClick={onButtonClick}>
        ok
      </WrappedButton>
    );
    const myButton = container.querySelector("my-button");
    expect(myButton?.shadowRoot?.textContent).toBe("default:");
    expect(myButton?.textContent).toBe("ok");
    expect(ref.current?.type).toBe("default");
    expect(ref.current?.constructor).toBe(MyButton);
    expect(onButtonClick).not.toBeCalled();
    (myButton?.shadowRoot?.firstChild as HTMLElement).click();
    expect(onButtonClick).toBeCalledTimes(1);
    expect(onButtonClick.mock.calls[0][0]).toMatchObject({
      type: "button.click",
      detail: "default",
    });
  });
});
