import { makeProviderRefreshable } from "./makeProviderRefreshable";
import { handleHttpError } from "./handleHttpError";

jest.mock("./handleHttpError");

describe("makeProviderRefreshable", () => {
  const resolve = jest.fn();
  const willReject = jest.fn().mockRejectedValue({
    message: "oops",
  });
  const provider = {
    resolve,
    willReject,
  } as any;
  makeProviderRefreshable(provider);

  const dependent = {
    brick: {
      element: {},
      context: {},
    },
    transform: "hello",
    method: "resolve",
    args: [1],
    field: "data",
  };
  const anotherDependent = {
    brick: {
      element: {},
      context: {
        match: {
          params: {
            quality: "good",
          },
        },
      },
    },
    method: "resolve",
    args: [1],
    ref: "ref",
    transform: {
      quality: "${quality}",
      hallo: "@{}",
    },
    intermediateTransformFrom: "data",
  };
  const rejectionHandledDependent = {
    brick: {
      element: {},
      context: {
        match: {
          params: {
            quality: "bad",
          },
        },
      },
    },
    transform: "hello",
    method: "willReject",
    args: [1],
    field: "data",
    onReject: {
      transform: {
        error: "@{message}",
        errorQuality: "${quality}",
      },
    },
  };
  const rejectionHandledDependentWithoutContext = {
    brick: {
      element: {},
    },
    transform: "hello",
    method: "willReject",
    args: [1],
    field: "data",
    onReject: {
      transform: {
        error: "@{message}",
      },
    },
  };
  provider.$$dependents.push(dependent);
  provider.$$dependents.push(anotherDependent);
  provider.$$dependents.push(rejectionHandledDependent);
  provider.$$dependents.push(rejectionHandledDependentWithoutContext);

  afterEach(() => {
    dependent.brick.element = {};
    anotherDependent.brick.element = {};
    rejectionHandledDependent.brick.element = {};
    rejectionHandledDependentWithoutContext.brick.element = {};
    resolve.mockReset();
    (handleHttpError as jest.Mock).mockClear();
  });

  it("should refresh", async () => {
    resolve.mockResolvedValue({
      data: "world",
    });
    await provider.$refresh();
    expect(resolve).toBeCalledTimes(1);
    expect(dependent.brick.element).toEqual({
      hello: "world",
    });
    expect(anotherDependent.brick.element).toEqual({
      quality: "good",
      hallo: "world",
    });
    expect(rejectionHandledDependent.brick.element).toEqual({
      error: "oops",
      errorQuality: "bad",
    });
    expect(rejectionHandledDependentWithoutContext.brick.element).toEqual({
      error: "oops",
    });
  });

  it("should handle errors", async () => {
    const error = {
      error: "failed",
    };
    resolve.mockRejectedValue(error);
    await provider.$refresh();
    expect(resolve).toBeCalledTimes(1);
    expect(handleHttpError).toBeCalledWith(error);
  });

  it("should ignore errors", async () => {
    const error = {
      error: "failed",
    };
    resolve.mockRejectedValue(error);
    await provider.$refresh({
      ignoreErrors: true,
    });
    expect(handleHttpError).not.toBeCalled();
  });

  it("should throw errors", async () => {
    expect.assertions(2);
    const error = {
      error: "failed",
    };
    resolve.mockRejectedValue(error);
    try {
      await provider.$refresh({
        throwErrors: true,
      });
    } catch (err) {
      expect(handleHttpError).toBeCalledWith(error);
      expect(err).toBe(error);
    }
  });
});
