import React from "react";
import { describe, test, expect } from "@jest/globals";
import { screen, render, fireEvent } from "@testing-library/react";
import { Preview } from "./Preview.jsx";
import { ImageListContext } from "./ImageListContext.js";
import { act } from "react-dom/test-utils";

const { Provider } = ImageListContext;

describe("Preview", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("should work", () => {
    const currentUUid = 10;
    const setCurrentUUid = jest.fn();
    const previewImageList = [
      {
        uuid: 10,
        index: 0,
        src: "http://localhost/src1",
        alt: "alt1",
        preview: true,
      },
      {
        uuid: 11,
        index: 1,
        src: "http://localhost/src2",
        alt: "alt2",
        preview: true,
      },
    ];

    const onClose = jest.fn();

    const { container } = render(
      <Provider
        value={{
          previewImageList,
          setCurrentUUid,
          currentUUid,
          registerImage: jest.fn(),
        }}
      >
        <Preview visible={true} onClose={onClose} />
      </Provider>
    );

    expect(
      container.querySelector(".preview-operations-progress")?.textContent
    ).toBe("1 / 2");
    expect(container.querySelector("img")?.src).toBe("http://localhost/src1");
    expect(container.querySelector("img")?.alt).toBe("alt1");
    expect(container.querySelector("img")?.style.transform).toBe(
      "translate3d(0px, 0px, 0) scale3d(1, 1, 1) rotate(0deg)"
    );

    fireEvent.click(container.querySelector(".preview-switch-left") as Element);
    expect(setCurrentUUid).lastCalledWith(10);
    fireEvent.click(
      container.querySelector(".preview-switch-right") as Element
    );
    expect(setCurrentUUid).lastCalledWith(11);
    fireEvent.click(
      container.querySelector(".preview-switch-right") as Element
    );
    expect(setCurrentUUid).lastCalledWith(11);
    fireEvent.click(container.querySelector(".preview-switch-left") as Element);
    expect(setCurrentUUid).lastCalledWith(10);

    fireEvent.click(screen.getByTestId("preview-operations-button-zoom-in"));
    act(() => {
      jest.runAllTimers();
    });
    expect(container.querySelector("img")?.style.transform).toBe(
      "translate3d(0px, 0px, 0) scale3d(1.5, 1.5, 1) rotate(0deg)"
    );

    fireEvent.click(screen.getByTestId("preview-operations-button-zoom-out"));
    act(() => {
      jest.runAllTimers();
    });
    expect(container.querySelector("img")?.style.transform).toBe(
      "translate3d(0px, 0px, 0) scale3d(1, 1, 1) rotate(0deg)"
    );

    fireEvent.click(
      screen.getByTestId("preview-operations-button-rotate-right")
    );
    act(() => {
      jest.runAllTimers();
    });
    expect(container.querySelector("img")?.style.transform).toBe(
      "translate3d(0px, 0px, 0) scale3d(1, 1, 1) rotate(90deg)"
    );

    fireEvent.click(
      screen.getByTestId("preview-operations-button-rotate-left")
    );
    act(() => {
      jest.runAllTimers();
    });
    expect(container.querySelector("img")?.style.transform).toBe(
      "translate3d(0px, 0px, 0) scale3d(1, 1, 1) rotate(0deg)"
    );

    fireEvent.click(screen.getByTestId("preview-operations-button-close"));
    expect(onClose).toBeCalledTimes(1);

    fireEvent.click(container.querySelector(".preview-image-wrap") as Element);
    expect(onClose).toBeCalledTimes(2);
  });
});
