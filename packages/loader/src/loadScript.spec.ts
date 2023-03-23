import { describe, jest, test, expect } from "@jest/globals";
import { fireEvent } from "@testing-library/dom";
import _loadScript from "./loadScript.js";

const dispatchEvent = jest.spyOn(window, "dispatchEvent");

describe("loadScript", () => {
  let loadScript: typeof _loadScript;
  let firstScript: HTMLScriptElement;

  beforeEach(() => {
    firstScript = document.createElement("script");
    document.head.appendChild(firstScript);

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require("./loadScript.js");
      loadScript = m.default;
    });
  });

  afterEach(() => {
    for (const script of document.head.querySelectorAll("script")) {
      script.remove();
    }
  });

  test("load ok", async () => {
    const promise = loadScript("x.js");
    expect(dispatchEvent).toBeCalledTimes(1);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: "request.start" })
    );
    const script = document.querySelector("script")!;
    fireEvent.load(script);
    await promise;
    expect(dispatchEvent).toBeCalledTimes(2);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: "request.end" })
    );
  });

  test("load failed", async () => {
    const promise = loadScript("x.js");
    expect(dispatchEvent).toBeCalledTimes(1);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: "request.start" })
    );
    const script = document.querySelector("script")!;
    fireEvent.error(script);
    await expect(promise).rejects.toBeTruthy();
    expect(dispatchEvent).toBeCalledTimes(2);
    expect(dispatchEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: "request.end" })
    );
  });

  test("load multiple script", () => {
    expect(document.querySelectorAll("script").length).toBe(1);
    loadScript(["http://example.com/a.js", "http://example.com/b.js"]);
    loadScript("c.js", "prefix/");
    // Hit cache
    loadScript("http://example.com/a.js");
    const scripts = document.querySelectorAll("script");
    expect(scripts.length).toBe(4);
    expect(scripts[0].src).toBe("http://localhost/prefix/c.js");
    expect(scripts[1].src).toBe("http://example.com/b.js");
    expect(scripts[2].src).toBe("http://example.com/a.js");
  });
});
