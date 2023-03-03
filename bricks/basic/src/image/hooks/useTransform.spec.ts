import { renderHook } from "@testing-library/react-hooks";
import { describe, test, expect } from "@jest/globals";
import useTransform from "./useTransform.js";

describe("useTransform", () => {
  it("should work", async (): Promise<void> => {
    const { result, waitForNextUpdate } = renderHook(() => useTransform());

    expect(result.current.transform).toEqual({
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotate: 0,
    });

    result.current.updateTransform({
      translateX: 10,
      rotate: 90,
    });
    await waitForNextUpdate();
    expect(result.current.transform).toEqual({
      translateX: 10,
      translateY: 0,
      scale: 1,
      rotate: 90,
    });

    result.current.dispatchZoomChange(2.5);
    await waitForNextUpdate();
    expect(result.current.transform).toEqual({
      translateX: 10,
      translateY: 0,
      scale: 2.5,
      rotate: 90,
    });

    result.current.dispatchZoomChange(100);
    await waitForNextUpdate();
    expect(result.current.transform).toEqual({
      translateX: 10,
      translateY: 0,
      scale: 50,
      rotate: 90,
    });

    result.current.dispatchZoomChange(0.5);
    await waitForNextUpdate();
    expect(result.current.transform).toEqual({
      translateX: 10,
      translateY: 0,
      scale: 25,
      rotate: 90,
    });

    result.current.dispatchZoomChange(0.0005);
    await waitForNextUpdate();
    expect(result.current.transform).toEqual({
      translateX: 10,
      translateY: 0,
      scale: 1,
      rotate: 90,
    });

    result.current.resetTransform();
    expect(result.current.transform).toEqual({
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotate: 0,
    });
  });
});
