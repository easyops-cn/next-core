import fetch from "./fetch.js";
import { FetchMock, GlobalWithFetchMock } from "jest-fetch-mock";
const customGlobal: GlobalWithFetchMock =
  global as unknown as GlobalWithFetchMock;
customGlobal.fetch = require("jest-fetch-mock");
customGlobal.fetchMock = customGlobal.fetch;
import * as runtime from "@next-core/runtime";
const fakeFetch = global.fetch as FetchMock;
const fakeRevolve = jest.fn();
// Mock a custom element of `any-provider`.
customElements.define(
  "any-provider",
  class Tmp extends HTMLElement {
    resolve(): string {
      fakeRevolve();
      return "resolved";
    }
  }
);

// Mock a custom element of `any-provider`.
customElements.define(
  "error-provider",
  class Tmp extends HTMLElement {
    resolve(): Promise<unknown> {
      return Promise.reject(new Error("oops"));
    }
  }
);

jest.mock("@next-core/runtime");

jest
  .spyOn(runtime, "fetchByProvider")
  .mockImplementation((provider: string) => {
    if (["error-provider", "any-provider"].includes(provider)) {
      const providerElement = document.createElement(provider);
      return (providerElement as any).resolve();
    }
    if (provider === "undefined-provider")
      throw new Error('Provider not defined: "undefined-provider"');
    return global.fetch("http://fake.com/api").then((i) => i.json());
  });

const expected = {
  name: "Alex",
  age: "29",
};

describe("fetch", () => {
  beforeEach((): void => {
    fakeFetch.mockClear();
    fakeFetch.mockResponse(JSON.stringify(expected));

    jest.useFakeTimers();
    jest.setTimeout(8000);
  });

  afterEach((): void => {
    fakeFetch.resetMocks();
    fakeRevolve.mockClear();
  });

  it("should resolve normal  provider", async () => {
    const result = await fetch("any-provider", true, ["abc"]);

    expect(result).toBe("resolved");
    expect(fakeRevolve).toHaveBeenCalledTimes(1);
  });

  it("should throw error ", async () => {
    expect.assertions(1);
    try {
      await fetch("error-provider", true, ["abc"]);
    } catch (e: any) {
      expect(e.message).toBe("oops");
    }
  });

  it("should throw error when not defined provider", async () => {
    expect.assertions(1);
    try {
      await fetch("undefined-provider", true, ["abc"]);
    } catch (e: any) {
      expect(e.message).toContain('Provider not defined: "undefined-provider"');
    }
  });

  it("should resolve flow api provider", async () => {
    const result = await fetch("easyops.custom_api@test", false, ["abc"]);

    expect(result).toEqual(expected);
    expect(fakeFetch).toHaveBeenCalledTimes(1);

    const result2 = await fetch("easyops.custom_api@test", false, ["abc"]);

    expect(result2).toEqual(expected);
    expect(fakeFetch).toHaveBeenCalledTimes(2);
  });

  it("should resolve flow api provider by cache", async () => {
    const result = await fetch("easyops.custom_api@test", true, [
      {
        url: "api/gateway/easyops.api.cmdb.cmdb_object.ListObjectBasic@1.1.0/object_basic",
        originalUri: "/object_basic",
        method: "get",
        responseWrapper: true,
        isFileType: false,
      },
    ]);

    expect(result).toEqual(expected);
    expect(fakeFetch).toHaveBeenCalledTimes(1);

    const result2 = await fetch("easyops.custom_api@test", true, [
      {
        isFileType: false,
        responseWrapper: true,
        url: "api/gateway/easyops.api.cmdb.cmdb_object.ListObjectBasic@1.1.0/object_basic",
        originalUri: "/object_basic",
        method: "get",
      },
    ]);

    // use cached response data
    expect(result2).toEqual(expected);
    expect(fakeFetch).toHaveBeenCalledTimes(1);

    const result3 = await fetch("easyops.custom_api@test", false, [
      {
        method: "post",
      },
    ]);

    // clear cache data with same request and refetch
    expect(result3).toEqual(expected);
    expect(fakeFetch).toHaveBeenCalledTimes(2);
  });

  it("should resolve normal provider by cache", async () => {
    const result = await fetch("providers-of-cmbd.a", true, [
      "_DASHBOARD_PROVIDER",
      null,
    ]);

    expect(result).toEqual(expected);
    expect(fakeFetch).toHaveBeenCalledTimes(1);

    const result2 = await fetch("providers-of-cmbd.a", true, [
      "_DASHBOARD_PROVIDER",
      null,
    ]);

    // cached response data
    expect(result2).toEqual(expected);
    expect(fakeFetch).toHaveBeenCalledTimes(1);

    const result3 = await fetch("providers-of-cmbd.a", false, [
      "_DASHBOARD_PROVIDER",
      null,
    ]);

    // Clear cache
    expect(result3).toEqual(expected);
    expect(fakeFetch).toHaveBeenCalledTimes(2);
  });
});
