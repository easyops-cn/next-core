import "whatwg-fetch";
import { fetch } from "./fetch";

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
      method: "GET",
    });
    expect(spyOnFetch.mock.calls[1][0]).toMatchObject({
      url: "http://mock.com/post",
      method: "POST",
    });
    expect(spyOnFetch).toHaveBeenNthCalledWith(3, req);
  });
});
