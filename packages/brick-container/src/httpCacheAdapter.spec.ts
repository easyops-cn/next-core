import {
  createHttpInstance,
  defaultAdapter,
  http,
} from "@next-core/brick-http";
import { httpCacheAdapter } from "./httpCacheAdapter";
import { FetchMock, GlobalWithFetchMock } from "jest-fetch-mock";
// import fetchMock, {enableFetchMocks} from "jest-fetch-mock";
const customGlobal: GlobalWithFetchMock =
  global as unknown as GlobalWithFetchMock;
customGlobal.fetch = require("jest-fetch-mock");
customGlobal.fetchMock = customGlobal.fetch;
const spyOnFetch = global.fetch as FetchMock;
customGlobal.fetch.mockResponse(JSON.stringify({ a: "a" }));
describe("cacheAdapter", function () {
  const spyConsoleWarn = jest.spyOn(console, "warn");
  beforeEach(() => {
    createHttpInstance({ adapter: httpCacheAdapter(defaultAdapter) });
  });

  afterEach(() => {
    spyConsoleWarn.mockClear();
    spyOnFetch.mockClear();
  });

  it("should work!", async () => {
    await http.get("http://example.com", { params: { a: "a", b: "b" } });
    expect(spyOnFetch.mock.calls.length).toBe(1);
    expect(spyConsoleWarn.mock.calls.length).toBe(0);
    await http.get("http://example.com", { params: { a: "a", b: "b" } });
    expect(spyOnFetch.mock.calls.length).toBe(1);
    expect(spyConsoleWarn.mock.calls.length).toBe(1);
    await http.get("http://example.com", { params: { b: "b", a: "a" } });
    expect(spyOnFetch.mock.calls.length).toBe(1);
    expect(spyConsoleWarn.mock.calls.length).toBe(2);

    await http.get("http://example.com", { params: { a: "a", b: "b1" } });
    expect(spyOnFetch.mock.calls.length).toBe(2);

    await http.post("http://example.com/post", { a: "a", b: "b1" });
    expect(spyOnFetch.mock.calls.length).toBe(3);
    await http.post("http://example.com/post", { a: "a", b: "b1" });
    expect(spyOnFetch.mock.calls.length).toBe(4);

    window.dispatchEvent(new CustomEvent("http:cache.end"));

    await http.get("http://example.com", { params: { a: "a", b: "b" } });
    expect(spyOnFetch.mock.calls.length).toBe(5);
    expect(spyConsoleWarn.mock.calls.length).toBe(2);
    await http.get("http://example.com", { params: { a: "a", b: "b" } });
    expect(spyOnFetch.mock.calls.length).toBe(6);
    expect(spyConsoleWarn.mock.calls.length).toBe(2);
  });

  it("do not cache  when useCache is false.", async () => {
    await http.get("http://example.com", { params: { a: "a", b: "b" } });
    expect(spyOnFetch.mock.calls.length).toBe(1);
    expect(spyConsoleWarn.mock.calls.length).toBe(0);
    await http.get("http://example.com", {
      params: { a: "a", b: "b" },
      useCache: false,
    });
    expect(spyOnFetch.mock.calls.length).toBe(2);
    expect(spyConsoleWarn.mock.calls.length).toBe(0);
    await http.get("http://example.com", {
      params: { b: "b", a: "a" },
      useCache: true,
    });
    expect(spyOnFetch.mock.calls.length).toBe(3);
    expect(spyConsoleWarn.mock.calls.length).toBe(0);

    await http.get("http://example.com", { params: { a: "a", b: "b" } });
    expect(spyOnFetch.mock.calls.length).toBe(3);
    expect(spyConsoleWarn.mock.calls.length).toBe(1);
  });

  it("should work with postSearch", async () => {
    await http.post("http://example.com/cmdb.instance.PostSearch/instance", {
      a: "a",
      b: "b",
    });
    expect(spyOnFetch.mock.calls.length).toBe(1);
    expect(spyConsoleWarn.mock.calls.length).toBe(0);

    await http.post("http://example.com/cmdb.instance.PostSearch/instance", {
      b: "b",
      a: "a",
    });
    expect(spyOnFetch.mock.calls.length).toBe(1);
    expect(spyConsoleWarn.mock.calls.length).toBe(1);
  });
});
