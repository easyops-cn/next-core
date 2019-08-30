import "whatwg-fetch";
import { fetch, pushInterceptor } from "./fetch";

const spyOnFetch = (window.fetch = jest.fn());

describe("fetch", () => {
  afterEach(() => {
    spyOnFetch.mockReset();
  });

  it("should work with no interceptors", () => {
    fetch("http://mock.com/get");
    fetch("http://mock.com/post", { method: "POST" });
    const req = new Request("http://mock.com/put", { method: "PUT" });
    fetch(req);

    expect(spyOnFetch.mock.calls[0][0]).toMatchObject({
      url: "http://mock.com/get",
      method: "GET"
    });
    expect(spyOnFetch.mock.calls[1][0]).toMatchObject({
      url: "http://mock.com/post",
      method: "POST"
    });
    expect(spyOnFetch).toHaveBeenNthCalledWith(3, req);
  });

  it("should work with one interceptor", async () => {
    const pin = jest.fn();
    const removeInterceptor = pushInterceptor((req, next) => {
      pin(1);
      return next(
        new Request(req, {
          method: "POST"
        })
      )
        .then(async response => {
          pin(2);
          const text = await response.text();
          return new Response(`${text} even better`);
        })
        .finally(() => {
          pin(3);
        });
    });
    spyOnFetch.mockReturnValueOnce(Promise.resolve(new Response("good")));

    const result = await fetch("http://mock.com/get");

    expect(pin).toHaveBeenNthCalledWith(1, 1);
    expect(pin).toHaveBeenNthCalledWith(2, 2);
    expect(pin).toHaveBeenNthCalledWith(3, 3);
    expect(pin.mock.calls.length).toBe(3);
    expect(spyOnFetch.mock.calls[0][0]).toMatchObject({
      url: "http://mock.com/get",
      method: "POST"
    });
    expect(await result.text()).toBe("good even better");

    removeInterceptor();
    // try remove again
    removeInterceptor();
  });

  it("should work with multiple interceptors", async () => {
    const pin = jest.fn();
    const removeInterceptor1 = pushInterceptor((req, next) => {
      pin(1);
      return next(
        new Request(req, {
          method: "POST",
          mode: "no-cors"
        })
      )
        .then(async response => {
          pin(5);
          const text = await response.text();
          return new Response(`${text} even perfect`);
        })
        .finally(() => {
          pin(6);
        });
    });
    const removeInterceptor2 = pushInterceptor((req, next) => {
      pin(2);
      return next(
        new Request(req, {
          method: "PUT"
        })
      )
        .then(async response => {
          pin(3);
          const text = await response.text();
          return new Response(`${text} even better`);
        })
        .finally(() => {
          pin(4);
        });
    });
    spyOnFetch.mockReturnValueOnce(Promise.resolve(new Response("good")));

    const result = await fetch("http://mock.com/get");

    expect(pin).toHaveBeenNthCalledWith(1, 1);
    expect(pin).toHaveBeenNthCalledWith(2, 2);
    expect(pin).toHaveBeenNthCalledWith(3, 3);
    expect(pin).toHaveBeenNthCalledWith(4, 4);
    expect(pin).toHaveBeenNthCalledWith(5, 5);
    expect(pin).toHaveBeenNthCalledWith(6, 6);
    expect(pin.mock.calls.length).toBe(6);
    expect(spyOnFetch.mock.calls[0][0]).toMatchObject({
      url: "http://mock.com/get",
      method: "PUT",
      mode: "no-cors"
    });
    expect(spyOnFetch.mock.calls.length).toBe(1);
    expect(await result.text()).toBe("good even better even perfect");

    removeInterceptor1();
    removeInterceptor2();
  });
});
