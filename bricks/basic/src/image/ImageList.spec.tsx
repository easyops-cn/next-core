import React, { Ref, createRef } from "react";
import { describe, test, expect } from "@jest/globals";
import { screen, render, fireEvent } from "@testing-library/react";
import { ImageList, ImageListRef } from "./ImageList.jsx";
import { act } from "react-dom/test-utils";

describe("ImageList", () => {
  test("should work", () => {
    const ref: Ref<ImageListRef> = createRef();
    const onVisibleChange = jest.fn();
    const imgList = [
      {
        src: "src1",
        fallback: "fallback1",
        alt: "alt1",
        placeholder: "placeholder1",
        width: 200,
        preview: true,
      },
      {
        src: "src2",
        fallback: "fallback2",
        alt: "alt2",
        placeholder: "placeholder2",
        width: 200,
        preview: false,
      },
      {
        src: "src3",
        fallback: "fallback3",
        alt: "alt3",
        placeholder: "placeholder3",
        width: 200,
        preview: true,
      },
    ];

    const { container, rerender, unmount } = render(
      <ImageList
        ref={ref}
        imgList={imgList}
        onVisibleChange={onVisibleChange}
      />
    );

    expect(container.querySelectorAll(".image")).toHaveLength(3);
    fireEvent.click(container.querySelector(".image-wrapper") as Element);

    expect(onVisibleChange).lastCalledWith(true);
    expect(
      container.querySelector(".preview-operations-progress")?.textContent
    ).toBe("1 / 2");

    fireEvent.click(container.querySelector(".preview-image-wrap") as Element);
    expect(onVisibleChange).lastCalledWith(false);

    act(() => {
      ref.current?.openPreview(2);
    });
    expect(onVisibleChange).lastCalledWith(true);
    expect(
      container.querySelector(".preview-operations-progress")?.textContent
    ).toBe("2 / 2");

    act(() => {
      ref.current?.closePreview();
    });
    expect(onVisibleChange).lastCalledWith(false);
  });
});
