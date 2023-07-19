describe("replaceChildren", () => {
  test.each<boolean>([true, false])("polyfill %s", (polyfill) => {
    const { replaceChildren } = Element.prototype;
    if (polyfill) {
      delete (Element.prototype as any).replaceChildren;
    }

    jest.isolateModules(() => {
      require("./replaceChildren.js");
    });

    const div1 = document.createElement("div");
    const div2 = document.createElement("div");
    document.body.append(div1, div2);
    expect(document.body.childNodes.length).toBe(2);

    const span1 = document.createElement("span");
    const span2 = document.createElement("span");
    document.body.replaceChildren(span1, "delimiter", span2);
    expect(document.body.childNodes.length).toBe(3);
    expect(document.body.firstChild).toBe(span1);
    expect(document.body.childNodes[1].textContent).toBe("delimiter");
    expect(document.body.lastChild).toBe(span2);

    document.body.replaceChildren();
    expect(document.body.childNodes.length).toBe(0);

    if (polyfill) {
      Element.prototype.replaceChildren = replaceChildren;
    }
  });
});
