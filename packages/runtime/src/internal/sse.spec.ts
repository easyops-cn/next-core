import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import * as runtime from "./Runtime.js";
import { startSSEStream } from "./sse.js";

const mockApiGetRouterRenderId = jest.spyOn(runtime, "_internalApiGetRenderId");

describe("sse stream", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockApiGetRouterRenderId.mockReturnValue("render-id-1");
  });

  test("success", async () => {
    const task = jest.fn<Promise<AsyncIterable<unknown>>, []>(async () => {
      return (async function* () {
        await new Promise((resolve) => setTimeout(resolve, 100));
        yield 1;
        await new Promise((resolve) => setTimeout(resolve, 100));
        yield 2;
        await new Promise((resolve) => setTimeout(resolve, 100));
      })();
    });
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();

    startSSEStream(task, {
      progress,
      success,
      error,
      finally: finallyCallback,
    });

    await (global as any).flushPromises();
    expect(progress).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(progress).toHaveBeenNthCalledWith(1, 1);

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(progress).toHaveBeenNthCalledWith(2, 2);
    expect(success).toHaveBeenCalledTimes(0);
    expect(finallyCallback).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(progress).toHaveBeenCalledTimes(2);
    expect(success).toHaveBeenCalledTimes(1);
    expect(finallyCallback).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(0);
  });

  test("error", async () => {
    const task = jest.fn<Promise<AsyncIterable<unknown>>, []>(async () => {
      return (async function* () {
        await new Promise((resolve) => setTimeout(resolve, 100));
        yield 1;
        throw new Error("Oops");
      })();
    });
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();

    startSSEStream(task, {
      progress,
      success,
      error,
      finally: finallyCallback,
    });

    await (global as any).flushPromises();
    expect(progress).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(progress).toHaveBeenNthCalledWith(1, 1);

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(progress).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(new Error("Oops"));
    expect(finallyCallback).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledTimes(0);
  });

  test("render id changed", async () => {
    const task = jest.fn<Promise<AsyncIterable<unknown>>, []>(async () => {
      return (async function* () {
        await new Promise((resolve) => setTimeout(resolve, 100));
        yield 1;
        await new Promise((resolve) => setTimeout(resolve, 100));
        yield 2;
        await new Promise((resolve) => setTimeout(resolve, 100));
      })();
    });
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();

    startSSEStream(task, {
      progress,
      success,
      error,
      finally: finallyCallback,
    });

    await (global as any).flushPromises();
    expect(progress).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(progress).toHaveBeenNthCalledWith(1, 1);

    mockApiGetRouterRenderId.mockReturnValue("render-id-2");
    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(progress).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledTimes(0);
    expect(finallyCallback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(progress).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledTimes(0);
    expect(finallyCallback).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(0);
  });

  test("render id changed after last yield", async () => {
    const task = jest.fn<Promise<AsyncIterable<unknown>>, []>(async () => {
      return (async function* () {
        await new Promise((resolve) => setTimeout(resolve, 100));
        yield 1;
        await new Promise((resolve) => setTimeout(resolve, 100));
      })();
    });
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();

    startSSEStream(task, {
      progress,
      success,
      error,
      finally: finallyCallback,
    });

    await (global as any).flushPromises();
    expect(progress).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(progress).toHaveBeenNthCalledWith(1, 1);

    mockApiGetRouterRenderId.mockReturnValue("render-id-2");
    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(progress).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledTimes(0);
    expect(finallyCallback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(progress).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledTimes(0);
    expect(finallyCallback).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(0);
  });

  test("render id changed after error", async () => {
    const task = jest.fn<Promise<AsyncIterable<unknown>>, []>(async () => {
      return (async function* () {
        await new Promise((resolve) => setTimeout(resolve, 100));
        yield 1;
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw new Error("Oops");
      })();
    });
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();

    startSSEStream(task, {
      progress,
      success,
      error,
      finally: finallyCallback,
    });

    await (global as any).flushPromises();
    expect(progress).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(progress).toHaveBeenNthCalledWith(1, 1);

    mockApiGetRouterRenderId.mockReturnValue("render-id-2");
    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(progress).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledTimes(0);
    expect(finallyCallback).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(0);
  });
});
