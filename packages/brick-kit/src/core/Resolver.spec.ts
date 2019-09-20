import { Resolver, makeProviderRefreshable } from "./Resolver";
import { RuntimeBrick } from "./BrickNode";
import { handleHttpError } from "../handleHttpError";

jest.mock("../handleHttpError");

describe("Resolver", () => {
  const resolver = new Resolver();

  beforeEach(() => {
    resolver.resetCache();
  });

  it("should do nothing if nothing to resolve", async () => {
    const result = await resolver.resolve([], null);
    expect(result).toBe(undefined);
  });

  it("should resolve", async () => {
    const testMethod = jest.fn().mockResolvedValue({
      data: {
        hello: "world"
      }
    });
    const provider = {
      testMethod,
      interval: {
        delay: 3000,
        ignoreErrors: true
      }
    };
    const bg = {
      querySelector: () => provider
    } as any;
    const bricks: RuntimeBrick[] = [
      {
        type: "brick-A",
        properties: {},
        events: {},
        lifeCycle: {
          useResolves: [
            {
              name: "testProp",
              provider: "any-provider",
              method: "testMethod"
            }
          ]
        }
      },
      {
        type: "brick-B",
        properties: {
          existedProp: "any"
        },
        events: {},
        lifeCycle: {
          useResolves: [
            {
              name: "testProp",
              provider: "any-provider",
              method: "testMethod",
              field: "data.hello"
            }
          ]
        }
      }
    ];
    resolver.resetRefreshQueue();
    await resolver.resolve(bricks, bg);
    expect(testMethod).toBeCalledTimes(1);
    expect(bricks[0].properties).toEqual({
      testProp: {
        data: {
          hello: "world"
        }
      }
    });
    expect(bricks[1].properties).toEqual({
      existedProp: "any",
      testProp: "world"
    });

    resolver.scheduleRefreshing();
    await jest.runTimersToTime(3000);
    expect(testMethod).toBeCalledTimes(2);
    resolver.resetRefreshQueue();
  });

  it("should throw if provider not found", async () => {
    const bg = {
      querySelector() {
        return null;
      }
    } as any;
    const bricks: RuntimeBrick[] = [
      {
        type: "brick-A",
        properties: {},
        events: {},
        lifeCycle: {
          useResolves: [
            {
              name: "testProp",
              provider: "any-provider",
              method: "testMethod"
            }
          ]
        }
      }
    ];
    expect.assertions(1);
    try {
      await resolver.resolve(bricks, bg);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});

describe("makeProviderRefreshable", () => {
  const resolve = jest.fn();
  const provider = {
    resolve
  } as any;
  makeProviderRefreshable(provider);

  const dependent = {
    brick: {
      element: {},
      context: {}
    },
    name: "hello",
    method: "resolve",
    actualArgs: [1],
    field: "data"
  };
  const anotherDependent = {
    brick: {
      element: {},
      context: {}
    },
    name: "hello",
    method: "resolve",
    actualArgs: [1]
  };
  provider.$$dependents.push(dependent);
  provider.$$dependents.push(anotherDependent);

  afterEach(() => {
    dependent.brick.element = {};
    anotherDependent.brick.element = {};
    resolve.mockReset();
    (handleHttpError as jest.Mock).mockClear();
  });

  it("should refresh", async () => {
    resolve.mockResolvedValue({
      data: "world"
    });
    await provider.$refresh();
    expect(resolve).toBeCalledTimes(1);
    expect(dependent.brick.element).toEqual({
      hello: "world"
    });
    expect(anotherDependent.brick.element).toEqual({
      hello: {
        data: "world"
      }
    });
  });

  it("should handle errors", async () => {
    const error = {
      error: "failed"
    };
    resolve.mockRejectedValue(error);
    await provider.$refresh();
    expect(resolve).toBeCalledTimes(1);
    expect(handleHttpError).toBeCalledWith(error);
  });

  it("should ignore errors", async () => {
    const error = {
      error: "failed"
    };
    resolve.mockRejectedValue(error);
    await provider.$refresh({
      ignoreErrors: true
    });
    expect(handleHttpError).not.toBeCalled();
  });

  it("should throw errors", async () => {
    expect.assertions(2);
    const error = {
      error: "failed"
    };
    resolve.mockRejectedValue(error);
    try {
      await provider.$refresh({
        throwErrors: true
      });
    } catch (err) {
      expect(handleHttpError).toBeCalledWith(error);
      expect(err).toBe(error);
    }
  });
});
