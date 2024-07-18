import { httpProxyRequest } from "./HttpProxyProvider.js";

jest.mock("@next-core/http", () => ({
  http: {
    post: jest.fn().mockResolvedValue({ data: "hello world" }),
  },
}));

describe("httpProxyRequest", () => {
  it("should work", async () => {
    const result = await httpProxyRequest({
      url: "www.test.com",
      method: "GET",
    });

    expect(result).toBe("hello world");
  });
});
