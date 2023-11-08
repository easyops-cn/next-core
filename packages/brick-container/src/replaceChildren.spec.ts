describe("replaceChildren", () => {
  test.each<boolean>([true, false])("polyfill %s", (polyfill) => {
    const { replaceChildren } = Element.prototype;
    const { replaceChildren: replaceChildrenDF } = DocumentFragment.prototype;
    if (polyfill) {
      delete (Element.prototype as any).replaceChildren;
      delete (DocumentFragment.prototype as any).replaceChildren;
    }

    jest.isolateModules(() => {
      require("./replaceChildren.js");
    });

    // Element:replaceChildren
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

    // DocumentFragment:replaceChildren
    const fragment = document.createDocumentFragment();

    const div3 = document.createElement("div");
    const div4 = document.createElement("div");
    fragment.append(div3, div4);
    expect(fragment.childNodes.length).toBe(2);

    const span3 = document.createElement("span");
    const span4 = document.createElement("span");
    fragment.replaceChildren(span3, "delimiter", span4);
    expect(fragment.childNodes.length).toBe(3);
    expect(fragment.firstChild).toBe(span3);
    expect(fragment.childNodes[1].textContent).toBe("delimiter");
    expect(fragment.lastChild).toBe(span4);

    fragment.replaceChildren();
    expect(fragment.childNodes.length).toBe(0);

    // Reset
    if (polyfill) {
      Element.prototype.replaceChildren = replaceChildren;
      DocumentFragment.prototype.replaceChildren = replaceChildrenDF;
    }
  });
});
