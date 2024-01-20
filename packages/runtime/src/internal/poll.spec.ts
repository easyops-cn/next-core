import { ProviderPollOptions } from "@next-core/types";
import * as runtime from "./Runtime.js";
import { DataStore } from "./data/DataStore.js";
import { RuntimeContext } from "./interfaces.js";
import { clearPollTimeout, startPoll } from "./poll.js";

const mockApiGetRouterRenderId = jest
  .spyOn(runtime, "_internalApiGetRenderId")
  .mockReturnValue("render-id-1");

const dispatchEvent = jest.spyOn(window, "dispatchEvent");

describe("poll", () => {
  let ctxStore: DataStore<"CTX">;
  let runtimeContext: RuntimeContext;

  beforeEach(async () => {
    ctxStore = new DataStore("CTX");
    runtimeContext = {
      ctxStore,
    } as RuntimeContext;
  });

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should work", async () => {
    const task = jest
      .fn()
      .mockResolvedValueOnce({ loaded: false })
      .mockResolvedValueOnce({ loaded: true });
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();
    const expectPollEnd = jest.fn((result) => (result as any).loaded);

    startPoll(
      task,
      {
        progress,
        success,
        error,
        finally: finallyCallback,
      },
      {
        expectPollEnd,
        delegateLoadingBar: true,
      },
      runtimeContext
    );

    expect(dispatchEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "request.start",
      })
    );

    jest.advanceTimersByTime(0);
    await (global as any).flushPromises();

    expect(progress).toHaveBeenNthCalledWith(1, { loaded: false });
    expect(success).not.toBeCalled();
    expect(finallyCallback).not.toBeCalled();
    expect(dispatchEvent).toBeCalledTimes(1);

    jest.advanceTimersByTime(3000);
    await (global as any).flushPromises();

    expect(progress).toHaveBeenNthCalledWith(2, { loaded: true });
    expect(success).toBeCalledWith({ loaded: true });
    expect(finallyCallback).toBeCalled();
    expect(error).not.toBeCalled();
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "request.end",
      })
    );
  });

  it("should set leading request delay", async () => {
    const task = jest.fn().mockResolvedValueOnce({ loaded: true });
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();
    const expectPollEnd = jest.fn().mockReturnValueOnce(true);

    startPoll(
      task,
      {
        progress,
        success,
        error,
        finally: finallyCallback,
      },
      {
        expectPollEnd,
        leadingRequestDelay: 1000,
      },
      runtimeContext
    );

    jest.advanceTimersByTime(0);
    await (global as any).flushPromises();

    expect(task).not.toBeCalled();

    jest.advanceTimersByTime(1000);
    await (global as any).flushPromises();

    expect(progress).toBeCalledWith({ loaded: true });
    expect(success).toBeCalledWith({ loaded: true });
    expect(error).not.toBeCalled();
    expect(finallyCallback).toBeCalled();
    expect(dispatchEvent).not.toBeCalled();
  });

  it("should work if request error", async () => {
    const task = jest.fn().mockRejectedValueOnce(new Error("oops"));
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();
    const expectPollEnd = jest.fn();

    startPoll(
      task,
      {
        progress,
        success,
        error,
        finally: finallyCallback,
      },
      {
        expectPollEnd,
      },
      runtimeContext
    );

    jest.advanceTimersByTime(0);
    await (global as any).flushPromises();
    jest.advanceTimersByTime(3000);
    await (global as any).flushPromises();

    expect(success).not.toBeCalled();
    expect(progress).not.toBeCalled();
    expect(finallyCallback).toBeCalled();
    expect(expectPollEnd).not.toBeCalled();
    expect(error).toBeCalledWith(new Error("oops"));
  });

  it("should work if continue on error", async () => {
    const task = jest
      .fn()
      .mockRejectedValueOnce(new Error("oops"))
      .mockResolvedValueOnce({ loaded: true });
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();
    const expectPollEnd = jest.fn().mockReturnValueOnce(true);

    startPoll(
      task,
      {
        progress,
        success,
        error,
        finally: finallyCallback,
      },
      {
        expectPollEnd,
        continueOnError: true,
      },
      runtimeContext
    );

    jest.advanceTimersByTime(0);
    await (global as any).flushPromises();

    expect(progress).not.toBeCalled();
    expect(success).not.toBeCalled();
    expect(finallyCallback).not.toBeCalled();
    expect(error).toBeCalledWith(new Error("oops"));

    jest.advanceTimersByTime(3000);
    await (global as any).flushPromises();

    expect(progress).toBeCalledWith({ loaded: true });
    expect(success).toBeCalledWith({ loaded: true });
    expect(finallyCallback).toBeCalled();
  });

  it("should clear poll timeout before next timeout function invoked", async () => {
    const task = jest.fn().mockResolvedValueOnce({ loaded: false });
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();
    const expectPollEnd = jest.fn().mockReturnValueOnce(false);

    startPoll(
      task,
      {
        progress,
        success,
        error,
        finally: finallyCallback,
      },
      {
        expectPollEnd,
      },
      runtimeContext
    );

    jest.advanceTimersByTime(0);
    await (global as any).flushPromises();

    jest.advanceTimersByTime(1000);
    clearPollTimeout();

    jest.advanceTimersByTime(2000);
    await (global as any).flushPromises();

    expect(task).toBeCalledTimes(1);
    expect(progress).toBeCalledTimes(1);
    expect(success).not.toBeCalled();
    expect(error).not.toBeCalled();
    expect(finallyCallback).not.toBeCalled();
  });

  it("should stop processing if router is re-rendered during request", async () => {
    const task = jest.fn().mockResolvedValueOnce({ loaded: true });
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();
    const expectPollEnd = jest.fn().mockReturnValueOnce(false);

    startPoll(
      task,
      {
        progress,
        success,
        error,
        finally: finallyCallback,
      },
      {
        expectPollEnd,
        delegateLoadingBar: true,
      },
      runtimeContext
    );

    expect(dispatchEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "request.start",
      })
    );

    jest.advanceTimersByTime(0);
    expect(task).toBeCalled();

    mockApiGetRouterRenderId.mockReturnValueOnce("render-id-2");
    await (global as any).flushPromises();

    expect(progress).not.toBeCalled();
    expect(success).not.toBeCalled();
    expect(error).not.toBeCalled();
    expect(finallyCallback).not.toBeCalled();
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "request.end",
      })
    );
  });

  it("should stop processing when request error if router is re-rendered during request", async () => {
    const task = jest.fn().mockRejectedValueOnce(new Error("oops"));
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();
    const expectPollEnd = jest.fn().mockReturnValueOnce(false);

    startPoll(
      task,
      {
        progress,
        success,
        error,
        finally: finallyCallback,
      },
      {
        expectPollEnd,
      },
      runtimeContext
    );

    jest.advanceTimersByTime(0);
    expect(task).toBeCalled();

    mockApiGetRouterRenderId.mockReturnValueOnce("render-id-2");
    await (global as any).flushPromises();

    expect(progress).not.toBeCalled();
    expect(success).not.toBeCalled();
    expect(error).not.toBeCalled();
    expect(finallyCallback).not.toBeCalled();
  });

  it("should stop immediately before request", async () => {
    const task = jest.fn().mockResolvedValueOnce({ loaded: false });
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();
    const expectPollEnd = jest.fn().mockReturnValueOnce(false);
    const expectPollStopImmediately = jest.fn().mockReturnValue(false);

    startPoll(
      task,
      {
        progress,
        success,
        error,
        finally: finallyCallback,
      },
      {
        interval: 1000,
        expectPollEnd,
        expectPollStopImmediately,
        delegateLoadingBar: true,
      },
      runtimeContext
    );

    expect(dispatchEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "request.start",
      })
    );

    jest.advanceTimersByTime(0);
    expect(task).toBeCalledTimes(1);

    await (global as any).flushPromises();
    expect(progress).toBeCalledWith({ loaded: false });

    jest.advanceTimersByTime(500);
    expectPollStopImmediately.mockReturnValueOnce(true);
    jest.advanceTimersByTime(500);
    await (global as any).flushPromises();

    expect(task).toBeCalledTimes(1);
    expect(progress).toBeCalledTimes(1);
    expect(success).not.toBeCalled();
    expect(error).not.toBeCalled();
    expect(finallyCallback).not.toBeCalled();
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "request.end",
      })
    );
  });

  it("should stop immediately during request", async () => {
    const task = jest.fn().mockResolvedValueOnce({ loaded: false });
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();
    const expectPollEnd = jest.fn().mockReturnValueOnce(false);
    const expectPollStopImmediately = jest.fn().mockReturnValue(false);

    startPoll(
      task,
      {
        progress,
        success,
        error,
        finally: finallyCallback,
      },
      {
        interval: 1000,
        expectPollEnd,
        expectPollStopImmediately,
        delegateLoadingBar: true,
      },
      runtimeContext
    );

    expect(dispatchEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "request.start",
      })
    );

    jest.advanceTimersByTime(0);
    expect(task).toBeCalledTimes(1);

    await (global as any).flushPromises();
    expect(progress).toBeCalledWith({ loaded: false });

    jest.advanceTimersByTime(1000);
    expect(task).toBeCalledTimes(2);
    expectPollStopImmediately.mockReturnValueOnce(true);
    await (global as any).flushPromises();

    expect(progress).toBeCalledTimes(1);
    expect(success).not.toBeCalled();
    expect(error).not.toBeCalled();
    expect(finallyCallback).not.toBeCalled();
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "request.end",
      })
    );
  });

  it("should stop based on the value of context", async () => {
    const task = jest.fn().mockResolvedValueOnce({ loaded: true });
    const progress = jest.fn();
    const success = jest.fn();
    const error = jest.fn();
    const finallyCallback = jest.fn();

    ctxStore.define(
      [
        {
          name: "flag",
          value: 0,
        },
      ],
      runtimeContext
    );

    startPoll(
      task,
      {
        progress,
        success,
        error,
        finally: finallyCallback,
      },
      {
        interval: 1000,
        expectPollEnd: "<% () => EVENT.detail + CTX.flag > 1 %>",
        delegateLoadingBar: true,
      } as unknown as ProviderPollOptions,
      { ...runtimeContext, event: { detail: 1 } as CustomEvent<any> }
    );

    expect(dispatchEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "request.start",
      })
    );

    jest.advanceTimersByTime(0);
    expect(task).toBeCalledTimes(1);

    await (global as any).flushPromises();
    expect(progress).toBeCalledWith({ loaded: true });

    jest.advanceTimersByTime(1000);
    expect(task).toBeCalledTimes(2);

    ctxStore.updateValue("flag", 1, "replace");
    await (global as any).flushPromises();

    expect(progress).toBeCalledTimes(2);
    expect(success).toBeCalledTimes(1);
    expect(error).not.toBeCalled();
    expect(finallyCallback).toBeCalledTimes(1);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "request.end",
      })
    );
  });
});
