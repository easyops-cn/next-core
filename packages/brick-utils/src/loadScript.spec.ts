import {
  loadScript as _loadScript,
  prefetchScript as _prefetchScript,
} from "./loadScript";

describe("loadScript", () => {
  let loadScript: typeof _loadScript;
  let prefetchScript: typeof _prefetchScript;

  beforeEach(() => {
    jest.resetModules();

    const script = document.createElement("script");
    document.head.appendChild(script);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require("./loadScript");
    loadScript = m.loadScript;
    prefetchScript = m.prefetchScript;
  });

  afterEach(() => {
    for (const script of document.head.querySelectorAll("script,link")) {
      document.head.removeChild(script);
    }
  });

  it("should load multiple script", () => {
    expect(document.head.childNodes.length).toBe(1);
    loadScript(["http://example.com/a.js", "http://example.com/b.js"]);
    // Hit cache
    loadScript("http://example.com/a.js");
    expect(document.head.childNodes.length).toBe(3);
    expect((document.head.childNodes[0] as HTMLScriptElement).src).toBe(
      "http://example.com/b.js"
    );
    expect((document.head.childNodes[1] as HTMLScriptElement).src).toBe(
      "http://example.com/a.js"
    );
  });

  it("should prefetch script", () => {
    loadScript("http://example.com/a.js");
    expect(document.head.childNodes.length).toBe(2);
    prefetchScript([
      "http://example.com/b.js",
      // Hit cache
      "http://example.com/a.js",
    ]);
    expect(document.head.childNodes.length).toBe(3);
    const links = document.querySelectorAll("link");
    expect(links.length).toBe(1);
    expect(links.item(0).rel).toBe("prefetch");
    expect(links.item(0).href).toBe("http://example.com/b.js");
  });
});
