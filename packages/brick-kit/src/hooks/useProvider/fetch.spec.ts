import { CUSTOM_API_PROVIDER } from "../../providers/CustomApi";
import fetch from "./fetch";
import * as runtime from "../../core/Runtime";
import * as flowApi from "../../core/FlowApi";
import { FetchMock, GlobalWithFetchMock } from "jest-fetch-mock";
const customGlobal: GlobalWithFetchMock =
  global as unknown as GlobalWithFetchMock;
customGlobal.fetch = require("jest-fetch-mock");
customGlobal.fetchMock = customGlobal.fetch;

const fakeFetch = global.fetch as FetchMock;

// Mock a custom element of `any-provider`.
customElements.define(
  "any-provider",
  class Tmp extends HTMLElement {
    resolve(): string {
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

const anyProvider = document.createElement("any-provider");
const errorProvider = document.createElement("error-provider");
const undefinedProvider = document.createElement("undefined-provider");

jest
  .spyOn(runtime, "_internalApiGetProviderBrick")
  .mockImplementation((provider: string) =>
    provider === "error-provider"
      ? errorProvider
      : provider === "undefined-provider"
      ? undefinedProvider
      : anyProvider
  );

const expected = {
  name: "Alex",
  age: "29",
};

describe("fetch", () => {
  beforeEach((): void => {
    fakeFetch.mockResponseOnce(JSON.stringify(expected));

    jest.useFakeTimers();
    jest.setTimeout(8000);
  });

  afterEach((): void => {
    fakeFetch.resetMocks();
  });

  it("should resolve normal  provider", async () => {
    const result = await fetch("any-provider", ["abc"]);

    expect(result).toBe("resolved");
  });

  it("should throw error ", async () => {
    expect.assertions(1);
    try {
      await fetch("error-provider", ["abc"]);
    } catch (e) {
      expect(e.message).toBe("oops");
    }
  });

  it("should throw error when not defined provider", async () => {
    expect.assertions(1);
    try {
      await fetch("undefined-provider", ["abc"]);
    } catch (e) {
      expect(e.message).toContain('Provider not defined: "undefined-provider"');
    }
  });

  it("should resolve flow api provider", async () => {
    const result = await fetch("easyops.custom_api@test", ["abc"]);

    expect(result).toEqual(expected);
    expect(fakeFetch).toHaveBeenCalledTimes(1);

    const result2 = await fetch("easyops.custom_api@test", ["abc"]);

    // cached response data
    expect(result2).toEqual(expected);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });
});
