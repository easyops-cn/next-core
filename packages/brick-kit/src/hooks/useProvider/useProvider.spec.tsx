import { renderHook } from "@testing-library/react-hooks";
import { FetchMock, GlobalWithFetchMock } from "jest-fetch-mock";
import React, { Suspense } from "react";
import { mount, shallow } from "enzyme";
import { act } from "react-dom/test-utils";
import * as fetchProvider from "./fetch";
import { useProvider } from "./useProvider";

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

const argsData = [
  {
    url: "api/gateway/api_service.easyops.custom_api.test/api/test",
    method: "get",
    responseWrapper: true,
  },
];

jest.mock("../../core/FlowApi", () => ({
  getArgsOfCustomApi: jest.fn().mockResolvedValue(argsData),
}));

describe("useProvider Hook", () => {
  afterEach((): void => {
    fetch.resetMocks();
  });

  it("should fetch provider with object destructuring", async (): Promise<void> => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useProvider("easyops.custom_api@test", [])
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
          <span onClick={handleClick} />
        </div>
      );
    };

    const wrapper = shallow(<ToDo onChange={mockFn} />);
    wrapper.find("span").simulate("click");

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

  beforeEach((): void => {
    jest.spyOn(fetchProvider, "default").mockRejectedValue(expectedError);
  });

  afterEach((): void => {
    fetch.resetMocks();
  });

  it("should handing error", async (): Promise<void> => {
    const onError = jest.fn();
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
          <Suspense fallback={"loading..."}>
            <ToDo />
          </Suspense>
        </div>
      );
    };

    const wrapper = mount(<TestComponent />);

    expect(wrapper.find("Suspense").prop("fallback")).toBe("loading...");

    await act(async () => {
      await (global as any).flushPromises();
    });

    expect(wrapper.find("ToDo").text()).toBe("rendered");
  });
});
