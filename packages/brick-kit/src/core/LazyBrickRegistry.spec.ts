import {
  loadAllLazyBricks as _loadAllLazyBricks,
  loadLazyBricks as _loadLazyBricks,
  registerLazyBricks as _registerLazyBricks,
} from "./LazyBrickRegistry";

jest.spyOn(window, "dispatchEvent");

describe("LazyBrickRegistry", () => {
  let loadAllLazyBricks: typeof _loadAllLazyBricks;
  let loadLazyBricks: typeof _loadLazyBricks;
  let registerLazyBricks: typeof _registerLazyBricks;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require("./LazyBrickRegistry");
    loadAllLazyBricks = m.loadAllLazyBricks;
    loadLazyBricks = m.loadLazyBricks;
    registerLazyBricks = m.registerLazyBricks;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should work for registerLazyBricks and loadLazyBricks", async () => {
    const fn1 = asyncResolveFactory(100);
    const fn2 = asyncResolveFactory(200);
    registerLazyBricks("my.lazy-brick-a", fn1);
    registerLazyBricks(["my.lazy-brick-b", "my.lazy-brick-c"], fn2);

    const promise = loadLazyBricks([
      "my.normal-brick",
      "my.lazy-brick-a",
      "my.lazy-brick-b",
      "my.lazy-brick-c",
    ]);

    expect(fn1).toBeCalledTimes(1);
    expect(fn2).toBeCalledTimes(1);
    expect(dispatchEvent).toBeCalledTimes(2);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "request.start",
      })
    );
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "request.start",
      })
    );

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(dispatchEvent).toBeCalledTimes(3);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        type: "request.end",
      })
    );

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(dispatchEvent).toBeCalledTimes(4);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        type: "request.end",
      })
    );

    await promise;
  });

  it("should throw error if loadLazyBricks failed", async () => {
    const mockError = new Error("mock error");
    const fn = jest.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            reject(mockError);
          }, 100);
        })
    );
    registerLazyBricks("my.lazy-brick", fn);
    const promise = loadLazyBricks(["my.lazy-brick"]);
    jest.advanceTimersByTime(100);
    expect(promise).rejects.toBe(mockError);
  });

  it("should work for loadAllLazyBricks", async () => {
    const fn1 = asyncResolveFactory(100);
    const fn2 = asyncResolveFactory(200);
    registerLazyBricks("my.lazy-brick-a", fn1);
    registerLazyBricks(["my.lazy-brick-b", "my.lazy-brick-c"], fn2);

    const promise = loadAllLazyBricks();

    expect(fn1).toBeCalledTimes(1);
    expect(fn2).toBeCalledTimes(1);
    expect(dispatchEvent).toBeCalledTimes(2);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "request.start",
      })
    );
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "request.start",
      })
    );

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(dispatchEvent).toBeCalledTimes(3);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        type: "request.end",
      })
    );

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(dispatchEvent).toBeCalledTimes(4);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        type: "request.end",
      })
    );

    await promise;
  });

  it("should throw error if register the same brick more than once", () => {
    const fn = jest.fn();
    registerLazyBricks("my.lazy-brick", fn);
    expect(() => registerLazyBricks("my.lazy-brick", fn)).toThrow();
  });
});

function asyncResolveFactory(delay: number): () => Promise<void> {
  return jest.fn(
    () =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, delay);
      })
  );
}
