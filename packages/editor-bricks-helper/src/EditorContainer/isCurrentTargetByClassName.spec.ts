import { isCurrentTargetByClassName } from "./isCurrentTargetByClassName";

describe("isCurrentTargetByClassName", () => {
  const outerElement = document.createElement("div");
  outerElement.classList.add("editorContainer");
  const outerWrapper = document.createElement("div");
  const innerInternalElement = document.createElement("div");
  innerInternalElement.classList.add(
    "editorContainer",
    "isTemplateInternalNode"
  );
  const innerInternalWrapper = document.createElement("div");
  const innerDelegatedElement = document.createElement("div");
  innerDelegatedElement.classList.add("editorContainer");
  const innerDelegatedWrapper = document.createElement("div");

  outerElement.appendChild(outerWrapper);
  outerWrapper.appendChild(innerInternalElement);
  innerInternalElement.appendChild(innerInternalWrapper);
  innerInternalWrapper.appendChild(innerDelegatedElement);
  innerDelegatedElement.appendChild(innerDelegatedWrapper);
  document.body.appendChild(outerElement);

  it.each<[HTMLElement, HTMLElement, boolean]>([
    [innerDelegatedWrapper, outerElement, false],
    [innerDelegatedElement, outerElement, false],
    [innerInternalWrapper, outerElement, true],
    [innerInternalElement, outerElement, true],
    [innerInternalElement, outerElement, true],
    [outerWrapper, outerElement, true],
    [document.body, outerElement, false],
  ])("should work", (targetElement, currentElement, result) => {
    expect(isCurrentTargetByClassName(targetElement, currentElement)).toBe(
      result
    );
  });
});
