import React from "react";
import { describe, test, expect } from "@jest/globals";
import { screen, render, fireEvent } from "@testing-library/react";
import { ImageComponent } from "./ImageComponent.jsx";
import { ImageListContext } from "./ImageListContext.js";

const { Provider } = ImageListContext;

describe("ImageComponent", () => {
  test("should work", () => {
    const onClick = jest.fn();
    const unRegister = jest.fn();
    const registerImage = jest.fn(() => unRegister);

    const { container, rerender, unmount } = render(
      <Provider
        value={{
          previewImageList: [],
          setCurrentUUid: jest.fn(),
          currentUUid: 0,
          registerImage,
        }}
      >
        <ImageComponent
          index={0}
          src={"src"}
          fallback={"fallback"}
          placeholder={"placeholder"}
          alt={"alt"}
          width={200}
          height={300}
          preview={true}
          onClick={onClick}
        />
      </Provider>
    );

    expect(container.querySelector(".image-mask")).toBeTruthy();
    expect(registerImage).lastCalledWith(expect.any(Number), {
      alt: "alt",
      index: 0,
      preview: true,
      src: undefined,
      uuid: expect.any(Number),
    });

    fireEvent.click(container.querySelector(".image-wrapper") as Element);
    expect(onClick).lastCalledWith(expect.any(Number), true);

    rerender(
      <Provider
        value={{
          previewImageList: [],
          setCurrentUUid: jest.fn(),
          currentUUid: 0,
          registerImage,
        }}
      >
        <ImageComponent
          index={0}
          src={"src"}
          fallback={"fallback"}
          placeholder={"placeholder"}
          alt={"alt"}
          width={200}
          height={300}
          preview={false}
          onClick={onClick}
        />
      </Provider>
    );

    expect(container.querySelector(".image-mask")).toBeFalsy();
    expect(registerImage).lastCalledWith(expect.any(Number), {
      alt: "alt",
      index: 0,
      preview: false,
      src: undefined,
      uuid: expect.any(Number),
    });

    fireEvent.click(container.querySelector(".image-wrapper") as Element);
    expect(onClick).lastCalledWith(expect.any(Number), false);

    expect(unRegister).not.toBeCalled();
    unmount();
    expect(unRegister).toBeCalled();
  });
});
