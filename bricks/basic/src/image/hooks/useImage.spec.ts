import { renderHook } from "@testing-library/react-hooks";
import useImage from "./useImage.js";

const LOAD_FAILURE_FLAG = ":LOAD_FAILURE_FLAG";

let originalImageSrcProto: PropertyDescriptor;

describe("useImage", () => {
  beforeAll(() => {
    originalImageSrcProto = Object.getOwnPropertyDescriptor(
      global.Image.prototype,
      "src"
    ) as PropertyDescriptor;

    Object.defineProperty(global.Image.prototype, "src", {
      set(src) {
        if (src.endsWith(LOAD_FAILURE_FLAG)) {
          setTimeout(() => this.onerror(new Error("image load error")), 100);
        } else {
          setTimeout(() => this.onload(), 100);
        }
      },
    });
  });

  afterAll(() => {
    Object.defineProperty(global.Image.prototype, "src", originalImageSrcProto);
  });

  it("should work when src type is string", async (): Promise<void> => {
    let src = "image";
    const { result, rerender, waitForNextUpdate } = renderHook(() =>
      useImage(src)
    );

    await waitForNextUpdate();
    expect(result.current).toEqual({
      src,
      status: "normal",
    });

    src = "image" + LOAD_FAILURE_FLAG;
    rerender(src);
    await waitForNextUpdate();
    expect(result.current).toEqual({
      src,
      status: "error",
    });
  });

  it("should work when src type is array", async (): Promise<void> => {
    let srcList = ["image", "image" + LOAD_FAILURE_FLAG, "image2"];

    const { result, rerender, waitForNextUpdate } = renderHook(() =>
      useImage(srcList)
    );

    await waitForNextUpdate();
    expect(result.current).toEqual({
      src: "image",
      status: "normal",
    });

    srcList = ["image" + LOAD_FAILURE_FLAG, "image2", "image"];
    rerender(srcList);
    await waitForNextUpdate();
    expect(result.current).toEqual({
      src: "image2",
      status: "normal",
    });

    srcList = ["image" + LOAD_FAILURE_FLAG, "image2" + LOAD_FAILURE_FLAG];
    rerender(srcList);
    await waitForNextUpdate();
    expect(result.current).toEqual({
      src: "image2" + LOAD_FAILURE_FLAG,
      status: "error",
    });
  });
});
