import React from "react";
import { describe, test, expect, jest } from "@jest/globals";
import { render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import type { UseBrickConf, UseSingleBrickConf } from "@next-core/types";
import { __secret_internals, handleHttpError } from "@next-core/runtime";
import { ReactUseBrick, ReactUseMultipleBricks } from "./ReactUseBrick.js";

const mockRenderUseBrick = __secret_internals.renderUseBrick as jest.Mock;
const mockMountUseBrick = __secret_internals.mountUseBrick as jest.Mock;
const mockUnmountUseBrick = __secret_internals.unmountUseBrick as jest.Mock;
const mockGetRenderId = __secret_internals.getRenderId as jest.Mock;
const mockHandleHttpError = handleHttpError as jest.Mock;

jest.mock("@next-core/runtime", () => ({
  __secret_internals: {
    renderUseBrick: jest.fn(),
    mountUseBrick: jest.fn((renderResult: any) => renderResult.args[1]),
    unmountUseBrick: jest.fn(),
    getRenderId: jest.fn(),
  },
  handleHttpError: jest.fn(),
  getV2RuntimeFromDll: jest.fn(),
}));

export function ListByUseBrick({
  useBrick,
  data,
  refCallback,
  ignoredCallback,
}: {
  useBrick: UseSingleBrickConf;
  data: unknown[];
  refCallback?: (element: HTMLElement | null) => void;
  ignoredCallback?: () => void;
}) {
  return (
    <>
      {data.map((datum, index) => (
        <ReactUseBrick
          useBrick={useBrick}
          data={datum}
          key={index}
          refCallback={refCallback}
          ignoredCallback={ignoredCallback}
        />
      ))}
    </>
  );
}

export function ListByMultipleUseBricks({
  useBrick,
  data,
}: {
  useBrick: UseBrickConf;
  data: unknown;
}) {
  return <ReactUseMultipleBricks useBrick={useBrick} data={data} />;
}

const consoleError = jest.spyOn(console, "error");

describe("ReactUseBrick", () => {
  test("basic", async () => {
    mockRenderUseBrick.mockImplementation((...args) =>
      Promise.resolve({
        tagName: "div",
        args,
      })
    );
    const useBrick = { brick: "div" };
    const { rerender, unmount } = render(
      <ListByUseBrick useBrick={useBrick} data={["a", "b"]} />
    );

    expect(mockRenderUseBrick).toHaveBeenCalledTimes(2);
    expect(mockRenderUseBrick).toHaveBeenNthCalledWith(
      1,
      useBrick,
      "a",
      undefined
    );
    expect(mockRenderUseBrick).toHaveBeenNthCalledWith(
      2,
      useBrick,
      "b",
      undefined
    );
    expect(mockMountUseBrick).not.toHaveBeenCalled();

    await act(() => (global as any).flushPromises());

    expect(mockMountUseBrick).toHaveBeenCalledTimes(2);
    expect(mockMountUseBrick).toHaveBeenCalledWith(
      {
        tagName: "div",
        args: [useBrick, "a"],
      },
      expect.any(HTMLDivElement)
    );
    expect(mockMountUseBrick).toHaveBeenCalledWith(
      {
        tagName: "div",
        args: [useBrick, "b"],
      },
      expect.any(HTMLDivElement)
    );

    // Re-render useBrick with the latter one props updated.
    rerender(<ListByUseBrick useBrick={useBrick} data={["a", "c"]} />);

    expect(mockRenderUseBrick).toHaveBeenCalledTimes(3);
    expect(mockRenderUseBrick).toHaveBeenNthCalledWith(
      3,
      useBrick,
      "c",
      undefined
    );

    expect(mockUnmountUseBrick).not.toHaveBeenCalled();
    await act(() => (global as any).flushPromises());

    expect(mockUnmountUseBrick).toHaveBeenCalledTimes(1);
    expect(mockUnmountUseBrick).toHaveBeenCalledWith(
      {
        tagName: "div",
        args: [useBrick, "b"],
      },
      "b"
    );

    expect(mockMountUseBrick).toHaveBeenCalledTimes(3);
    expect(mockMountUseBrick).toHaveBeenCalledWith(
      {
        tagName: "div",
        args: [useBrick, "c"],
      },
      expect.any(HTMLDivElement)
    );

    unmount();
    expect(mockHandleHttpError).not.toHaveBeenCalled();
    expect(mockUnmountUseBrick).toHaveBeenCalledTimes(3);
    expect(mockUnmountUseBrick).toHaveBeenCalledWith(
      {
        tagName: "div",
        args: [useBrick, "a"],
      },
      "a"
    );
    expect(mockUnmountUseBrick).toHaveBeenCalledWith(
      {
        tagName: "div",
        args: [useBrick, "c"],
      },
      "c"
    );
  });

  test("ignore stale render", async () => {
    jest.useFakeTimers();
    mockRenderUseBrick.mockImplementation(
      (...args) =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              tagName: "div",
              args,
            });
          }, 200);
        })
    );
    const useBrick = { brick: "div" };
    const { rerender, unmount } = render(
      <ListByUseBrick useBrick={useBrick} data={["a"]} />
    );

    expect(mockRenderUseBrick).toHaveBeenCalledTimes(1);
    expect(mockRenderUseBrick).toHaveBeenNthCalledWith(
      1,
      useBrick,
      "a",
      undefined
    );
    expect(mockMountUseBrick).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);
    await act(() => (global as any).flushPromises());

    expect(mockMountUseBrick).toHaveBeenCalledTimes(1);
    expect(mockMountUseBrick).toHaveBeenCalledWith(
      {
        tagName: "div",
        args: [useBrick, "a"],
      },
      expect.any(HTMLDivElement)
    );

    // First re-render.
    rerender(<ListByUseBrick useBrick={useBrick} data={["b"]} />);

    jest.advanceTimersByTime(100);
    await act(() => (global as any).flushPromises());

    expect(mockMountUseBrick).toHaveBeenCalledTimes(1);

    // Second re-render before the first one completes.
    rerender(<ListByUseBrick useBrick={useBrick} data={["c"]} />);

    // The first re-render should be ignored.
    jest.advanceTimersByTime(100);
    await act(() => (global as any).flushPromises());
    expect(mockMountUseBrick).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    await act(() => (global as any).flushPromises());

    expect(mockMountUseBrick).toHaveBeenCalledTimes(2);
    expect(mockMountUseBrick).toHaveBeenNthCalledWith(
      2,
      {
        tagName: "div",
        args: [useBrick, "c"],
      },
      expect.any(HTMLDivElement)
    );

    jest.useRealTimers();
    unmount();
  });

  test("render nothing", async () => {
    mockRenderUseBrick.mockImplementation(() =>
      Promise.resolve({
        tagName: null,
      })
    );
    const useBrick = { brick: "div" };
    const ignoredCallback = jest.fn();
    const { unmount } = render(
      <ListByUseBrick
        useBrick={useBrick}
        data={["a", "b"]}
        ignoredCallback={ignoredCallback}
      />
    );

    await act(() => (global as any).flushPromises());
    expect(ignoredCallback).toHaveBeenCalledTimes(2);

    unmount();
    expect(mockHandleHttpError).not.toHaveBeenCalled();
    expect(mockMountUseBrick).not.toHaveBeenCalled();
    expect(mockUnmountUseBrick).not.toHaveBeenCalled();
  });

  test("render failed", async () => {
    consoleError.mockImplementationOnce(() => void 0);
    const error = new Error("oops");
    mockRenderUseBrick.mockImplementation(() => Promise.reject(error));
    const useBrick = { brick: "div" };
    const { unmount } = render(
      <ListByUseBrick useBrick={useBrick} data={["a"]} />
    );

    await act(() => (global as any).flushPromises());
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Render useBrick failed:",
      useBrick,
      "with data:",
      "a"
    );

    expect(mockHandleHttpError).toHaveBeenCalledWith(error);

    unmount();
    expect(mockMountUseBrick).not.toHaveBeenCalled();
    expect(mockUnmountUseBrick).not.toHaveBeenCalled();
  });

  test("render failed but render id changed", async () => {
    let renderId = 1;
    mockGetRenderId.mockImplementation(() => `render-${renderId++}`);
    const error = new Error("oops");
    mockRenderUseBrick.mockImplementation(() => Promise.reject(error));
    const useBrick = { brick: "div" };
    const { unmount } = render(
      <ListByUseBrick useBrick={useBrick} data={["a"]} />
    );

    await act(() => (global as any).flushPromises());
    expect(consoleError).toHaveBeenCalledTimes(0);
    expect(mockHandleHttpError).not.toHaveBeenCalled();

    unmount();
    expect(mockMountUseBrick).not.toHaveBeenCalled();
    expect(mockUnmountUseBrick).not.toHaveBeenCalled();
    mockGetRenderId.mockReset();
  });

  test("refCallback", async () => {
    mockRenderUseBrick.mockImplementation((...args) =>
      Promise.resolve({
        tagName: "div",
        args,
      })
    );
    const useBrick = { brick: "div" };
    const refCallback = jest.fn();
    const { unmount } = render(
      <ListByUseBrick
        useBrick={useBrick}
        data={["a", "b"]}
        refCallback={refCallback}
      />
    );

    await act(() => (global as any).flushPromises());
    expect(refCallback).toHaveBeenCalledTimes(2);
    expect(refCallback).toHaveBeenNthCalledWith(1, expect.any(HTMLDivElement));
    expect(refCallback).toHaveBeenNthCalledWith(2, expect.any(HTMLDivElement));

    unmount();
    expect(refCallback).toHaveBeenCalledTimes(4);
    expect(refCallback).toHaveBeenNthCalledWith(3, null);
    expect(refCallback).toHaveBeenNthCalledWith(4, null);
  });
});

describe("ReactUseMultipleBricks", () => {
  test("with multiple useBricks", async () => {
    mockRenderUseBrick.mockImplementation((...args: any[]) =>
      Promise.resolve({
        tagName: args[0].brick,
        args,
      })
    );
    const useBrick = [{ brick: "div" }, { brick: "span" }];
    const { unmount } = render(
      <ListByMultipleUseBricks useBrick={useBrick} data={"m"} />
    );

    await act(() => (global as any).flushPromises());

    expect(mockMountUseBrick).toHaveBeenCalledTimes(2);
    expect(mockMountUseBrick).toHaveBeenCalledWith(
      {
        tagName: "div",
        args: [useBrick[0], "m"],
      },
      expect.any(HTMLDivElement)
    );
    expect(mockMountUseBrick).toHaveBeenCalledWith(
      {
        tagName: "span",
        args: [useBrick[1], "m"],
      },
      expect.any(HTMLSpanElement)
    );

    unmount();
    expect(mockUnmountUseBrick).toHaveBeenCalledTimes(2);
  });

  test("with single useBrick", async () => {
    mockRenderUseBrick.mockImplementation((...args) =>
      Promise.resolve({
        tagName: "div",
        args,
      })
    );
    const useBrick = { brick: "div" };
    const { unmount } = render(
      <ListByMultipleUseBricks useBrick={useBrick} data={"m"} />
    );

    await act(() => (global as any).flushPromises());

    expect(mockMountUseBrick).toHaveBeenCalledTimes(1);
    expect(mockMountUseBrick).toHaveBeenCalledWith(
      {
        tagName: "div",
        args: [useBrick, "m"],
      },
      expect.any(HTMLDivElement)
    );

    unmount();
    expect(mockUnmountUseBrick).toHaveBeenCalledTimes(1);
  });
});
