import { start, sendUrlChange } from "./listen";

describe("listen", () => {
  let postMessageSpy: jest.SpyInstance;

  beforeEach(() => {
    postMessageSpy = jest.spyOn(window.parent, "postMessage");
    postMessageSpy.mockClear();
  });

  afterEach(() => {
    postMessageSpy.mockRestore();
  });

  it("should not send message", async () => {
    sendUrlChange({ url: "/some-path" });
    expect(postMessageSpy).not.toHaveBeenCalled();
  });

  it("send message after initialize", async () => {
    Object.defineProperty(window, "self", {
      value: {},
      writable: true,
    });
    start("http://example.com");

    sendUrlChange({ url: "/some-path" });

    expect(postMessageSpy).toHaveBeenCalledWith(
      {
        sender: "next-core",
        type: "url-change",
        url: "/some-path",
      },
      "http://example.com"
    );
  });

  it("The cached URL should be sent on initialization", () => {
    Object.defineProperty(window, "self", {
      value: {},
      writable: true,
    });

    sendUrlChange({ url: "/cached-path" });

    start("http://example.com");

    expect(postMessageSpy).toHaveBeenCalledWith(
      {
        sender: "next-core",
        type: "url-change",
        url: "/cached-path",
      },
      "http://example.com"
    );
  });

  it("应该禁止非 localhost 的跨域消息", () => {
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://example.com",
      },
      writable: true,
    });

    start("https://different-domain.com");

    expect(postMessageSpy).not.toHaveBeenCalled();
  });
});
