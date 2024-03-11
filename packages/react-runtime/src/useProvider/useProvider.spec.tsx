import { renderHook } from "@testing-library/react-hooks";
import { FetchMock, GlobalWithFetchMock } from "jest-fetch-mock";
import React, { Suspense } from "react";
import "@testing-library/jest-dom";
import { act } from "react-dom/test-utils";
import * as fetchProvider from "./fetch.js";
import { useProvider } from "./useProvider.js";
import { fireEvent, render, waitFor } from "@testing-library/react";
import * as runtime from "@next-core/runtime";

const customGlobal: GlobalWithFetchMock =
  global as unknown as GlobalWithFetchMock;
customGlobal.fetch = require("jest-fetch-mock");
customGlobal.fetchMock = customGlobal.fetch;

const fetch = global.fetch as FetchMock;

const expected = {
  name: "Alex",
  age: "29",
};
jest.spyOn(fetchProvider, "default").mockResolvedValue(expected);

jest.mock("@next-core/runtime");

jest.spyOn(runtime, "fetchByProvider").mockImplementation(() => {
  return global.fetch("http://fake.com/api").then((i) => i.json());
});

describe("useProvider Hook", () => {
  afterEach((): void => {
    fetch.resetMocks();
  });

  it("should fetch provider with object destructuring", async (): Promise<void> => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useProvider("easyops.custom_api@test")
    );
    result.current.query([]);
    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.request.data).toBe(undefined);
    expect(result.current.response).toEqual(undefined);

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(result.current.data).toStrictEqual(expected);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.request.data).toStrictEqual(expected);
    expect(result.current.response).toEqual(expected);
    expect(result.current.request.loading).toBe(false);
  });

  it("should work when called `query` method", async () => {
    const mockFn = jest.fn();
    const ToDo = ({ onChange }: { onChange: (value: any) => void }) => {
      const request = useProvider();
      const handleClick = async () => {
        try {
          const data = await request.query("easyops.custom_api@test", [
            {
              name: "alex",
            },
          ]);

          onChange(data);
        } catch (e) {
          // Do nothing...
        }
      };
      return (
        <div>
          <span data-testid={"trigger"} onClick={handleClick} />
        </div>
      );
    };

    const { getByTestId } = render(<ToDo onChange={mockFn} />);

    fireEvent.click(getByTestId("trigger"));

    await act(async () => {
      await (global as any).flushPromises();
    });

    expect(mockFn).toHaveBeenCalledWith(expected);
  });
});

describe("Error handing", () => {
  const expectedError = {
    config: {
      method: "get",
      options: {
        params: undefined,
      } as any,
      url: "api/gateway/api_service.easyops.custom_api.test/api/test",
    },
    error: {
      name: "HttpFetchError",
    },
  };
  const onError = jest.fn();
  beforeEach((): void => {
    jest.spyOn(fetchProvider, "default").mockRejectedValue(expectedError);
  });

  afterEach((): void => {
    fetch.resetMocks();
    onError.mockReset();
  });

  it("should handing error", async (): Promise<void> => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useProvider(
        "easyops.custom_api@test",
        {
          onError,
        },
        []
      )
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.request.data).toBe(undefined);
    expect(result.current.response).toEqual(undefined);
    expect(result.current.request.loading).toBe(true);

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(onError).toBeCalled();
    expect(result.current.data).toBe(undefined);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toMatchObject(expectedError);
    expect(result.current.request.error).toMatchObject(expectedError);
    expect(result.current.request.data).toBeUndefined();
    expect(result.current.response).toBeUndefined();
    expect(result.current.request.loading).toBe(false);
  });

  it("should throw error with React Suspense", async () => {
    const ToDo = () => {
      const { error } = useProvider(
        "easyops.custom_api@test_suspense",
        { suspense: true, onError },
        []
      );

      return <div>{error ? "error" : "rendered"}</div>;
    };
    // eslint-disable-next-line react/display-name
    const TestComponent = () => {
      return (
        <div>
          <Suspense fallback={<div>loading...</div>}>
            <ToDo />
          </Suspense>
        </div>
      );
    };

    const { getByText } = render(<TestComponent />);

    expect(getByText("loading...")).toBeInTheDocument();

    await waitFor(async () => {
      await (global as any).flushPromises();
      expect(getByText("error")).toBeInTheDocument();
    });
  });
});

describe("useProviderHook with React Suspense", () => {
  it("should work with React Suspense", async () => {
    const ToDo = () => {
      const { error } = useProvider(
        "easyops.custom_api@test",
        { suspense: true },
        []
      );

      return <div>{error ? "error" : "rendered"}</div>;
    };
    // eslint-disable-next-line react/display-name
    const TestComponent = () => {
      return (
        <div>
          <Suspense fallback={<div>loading...</div>}>
            <ToDo />
          </Suspense>
        </div>
      );
    };

    const { getByText } = render(<TestComponent />);

    expect(getByText("loading...")).toBeInTheDocument();

    await waitFor(async () => {
      await (global as any).flushPromises();
      expect(getByText("rendered")).toBeInTheDocument();
    });
  });
});
