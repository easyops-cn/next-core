import { loadScript } from "./loadScript";

describe("loadScript", () => {
  beforeEach(() => {
    const script = document.createElement("script");
    document.head.appendChild(script);
  });

  afterEach(() => {
    for (const script of document.head.getElementsByTagName("script")) {
      document.head.removeChild(script);
    }
  });

  /* it("should load a script", () => {
    expect(document.head.childNodes.length).toBe(1);
    // First script
    loadScript("http://example.com/");
    expect(document.head.childNodes.length).toBe(2);
    expect((document.head.childNodes[0] as HTMLScriptElement).src).toBe(
      "http://example.com/"
    );
    // Use cache
    loadScript("http://example.com/");
    expect(document.head.childNodes.length).toBe(2);
  }); */

  it("should load multiple script", () => {
    expect(document.head.childNodes.length).toBe(1);
    // First script
    loadScript(["http://example.com/a.js", "http://example.com/b.js"]);
    expect(document.head.childNodes.length).toBe(3);
    expect((document.head.childNodes[0] as HTMLScriptElement).src).toBe(
      "http://example.com/b.js"
    );
    expect((document.head.childNodes[1] as HTMLScriptElement).src).toBe(
      "http://example.com/a.js"
    );
  });
});
