import { describe, jest, test, expect } from "@jest/globals";
import { fireEvent } from "@testing-library/dom";
import _loadStyle from "./loadStyle.js";

const dispatchEvent = jest.spyOn(window, "dispatchEvent");

describe("loadStyle", () => {
  let loadStyle: typeof _loadStyle;
  let firstScript: HTMLScriptElement;

  beforeEach(() => {
    firstScript = document.createElement("script");
    document.head.appendChild(firstScript);

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require("./loadStyle.js");
      loadStyle = m.default;
    });
  });

  afterEach(() => {
    for (const script of document.head.querySelectorAll("script,link")) {
      script.remove();
    }
  });

  test("load ok", async () => {
    const promise = loadStyle("x.css");
    expect(dispatchEvent).toBeCalledTimes(1);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: "request.start" })
    );
    const link = document.querySelector("link")!;
    fireEvent.load(link);
    await promise;
    expect(dispatchEvent).toBeCalledTimes(2);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: "request.end" })
    );
  });

  test("load failed", async () => {
    const promise = loadStyle("x.js");
    expect(dispatchEvent).toBeCalledTimes(1);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: "request.start" })
    );
    const link = document.querySelector("link")!;
    fireEvent.error(link);
    await expect(promise).rejects.toBeTruthy();
    expect(dispatchEvent).toBeCalledTimes(2);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: "request.end" })
    );
  });

  test("load multiple stylesheets", () => {
    expect(document.querySelectorAll("link").length).toBe(0);
    loadStyle(["http://example.com/a.css", "http://example.com/b.css"]);
    loadStyle("c.css", "prefix/");
    // Hit cache
    loadStyle("http://example.com/a.css", "prefix/");
    const links = document.querySelectorAll("link");
    expect(links.length).toBe(3);
    expect(links[0].href).toBe("http://example.com/a.css");
    expect(links[1].href).toBe("http://example.com/b.css");
    expect(links[2].href).toBe("http://localhost/prefix/c.css");
  });
});
