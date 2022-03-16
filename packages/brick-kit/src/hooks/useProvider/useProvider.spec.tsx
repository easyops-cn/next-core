import { renderHook, act } from "@testing-library/react-hooks";
import { useProvider } from "./useProvider";
import { FetchMock, GlobalWithFetchMock } from "jest-fetch-mock";
import { HttpFetchError } from "@next-core/brick-http";
import React, { Suspense } from "react";
import { mount, shallow } from "enzyme";
const customGlobal: GlobalWithFetchMock =
  global as unknown as GlobalWithFetchMock;
customGlobal.fetch = require("jest-fetch-mock");
customGlobal.fetchMock = customGlobal.fetch;

const fetch = global.fetch as FetchMock;

const argsData = [
  {
    url: "api/gateway/api_service.easyops.custom_api.test/api/test",
    method: "get",
    responseWrapper: true,
  },
];

const expected = {
  name: "Alex",
  age: "29",
};
jest.mock("../../core/FlowApi", () => ({
  getArgsOfCustomApi: jest.fn().mockResolvedValue(argsData),
}));

describe("useProvider Hook", () => {
  beforeEach((): void => {
    fetch.mockResponseOnce(JSON.stringify(expected));

    jest.useFakeTimers();
    jest.setTimeout(8000);
  });

  afterEach((): void => {
    fetch.resetMocks();
  });

  it("should fetch provider with object destructuring", async (): Promise<void> => {
    const { result } = renderHook(() =>
      useProvider("easyops.custom_api@test", [])
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.request.data).toBe(undefined);
    expect(result.current.response).toEqual(undefined);
    expect(result.current.request.loading).toBe(true);

    await (global as any).flushPromises();

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
          const data = await request.query("easyops.custom_api@test", {
            body: {
              name: "alex",
            },
          });

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

    await (global as any).flushPromises();

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
    fetch.mockRejectedValueOnce(new Error("Fetch Error"));

    jest.useFakeTimers();
    jest.setTimeout(8000);
  });

  afterEach((): void => {
    fetch.resetMocks();
  });

  it("should handing error", async (): Promise<void> => {
    const onError = jest.fn();
    const { result } = renderHook(() =>
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

    await (global as any).flushPromises();
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

    await (global as any).flushPromises();

    expect(wrapper.find("ToDo").text()).toBe("rendered");
  });
});
