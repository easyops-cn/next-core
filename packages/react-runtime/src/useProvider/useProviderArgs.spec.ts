import { renderHook } from "@testing-library/react-hooks";
import useProviderArgs from "./useProviderArgs.js";
import { useProviderArgsDefaults } from "./useProviderArgsDefaults.js";

describe("useProviderArgs", () => {
  it("should create custom options with `onMount: false` by default", (): void => {
    const { result } = renderHook((): any =>
      useProviderArgs("easyops.custom_api@test")
    );
    expect(result.current).toEqual({
      ...useProviderArgsDefaults,
      customOptions: {
        ...useProviderArgsDefaults.customOptions,
      },
      provider: "easyops.custom_api@test",
      requestInit: {
        args: null,
        options: {},
      },
    });
  });

  it("should work with `onMount: true`", (): void => {
    const { result } = renderHook(
      (): any =>
        useProviderArgs(
          "easyops.custom_api@test",
          {
            args: [
              {
                page: 1,
                pageSize: 10,
              },
            ],
            interceptorParams: {
              ignoreLoadingBar: true,
            },
          },
          []
        ) // onMount === true
    );
    expect(result.current).toEqual({
      ...useProviderArgsDefaults,
      provider: "easyops.custom_api@test",
      requestInit: {
        args: [
          {
            page: 1,
            pageSize: 10,
          },
        ],
        options: {
          interceptorParams: {
            ignoreLoadingBar: true,
          },
        },
      },
      customOptions: {
        ...useProviderArgsDefaults.customOptions,
        loading: true,
        data: undefined,
      },
      dependencies: [],
    });
  });

  it("should create custom options with 1st arg as config object with `onMount: true`", (): void => {
    const { result } = renderHook(
      (): any => useProviderArgs("easyops.custom_api@test", []) // onMount === true
    );
    expect(result.current).toEqual({
      ...useProviderArgsDefaults,
      provider: "easyops.custom_api@test",
      requestInit: {
        args: null,
        options: {},
      },
      customOptions: {
        ...useProviderArgsDefaults.customOptions,
        loading: true,
        data: undefined,
      },
      dependencies: [],
    });
  });

  it("should work with customOptions", (): void => {
    const { result } = renderHook(
      (): any => useProviderArgs({ loading: true }) // onMount === false
    );
    expect(result.current).toEqual({
      ...useProviderArgsDefaults,
      provider: "",
      requestInit: {
        args: null,
        options: {},
      },
      customOptions: {
        ...useProviderArgsDefaults.customOptions,
        loading: true,
        data: undefined,
      },
      dependencies: undefined,
    });
  });
});
