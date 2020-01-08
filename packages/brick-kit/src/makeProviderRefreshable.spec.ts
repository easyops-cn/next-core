import { makeProviderRefreshable } from "./makeProviderRefreshable";
import { handleHttpError } from "./handleHttpError";

jest.mock("./handleHttpError");

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
    transform: "hello",
    method: "resolve",
    actualArgs: [1],
    field: "data"
  };
  const anotherDependent = {
    brick: {
      element: {},
      context: {}
    },
    transform: "hello",
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
