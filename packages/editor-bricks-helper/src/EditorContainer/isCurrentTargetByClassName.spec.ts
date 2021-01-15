import { isCurrentTargetByClassName } from "./isCurrentTargetByClassName";

describe("isCurrentTargetByClassName", () => {
  const outerElement = document.createElement("div");
  outerElement.classList.add("editorContainer");
  const outerWrapper = document.createElement("div");
  const innerElement = document.createElement("div");
  innerElement.classList.add("editorContainer");
  const innerWrapper = document.createElement("div");

  outerElement.appendChild(outerWrapper);
  outerWrapper.appendChild(innerElement);
  innerElement.appendChild(innerWrapper);
  document.body.appendChild(outerElement);

  it.each<[HTMLElement, HTMLElement, boolean]>([
    [innerWrapper, innerElement, true],
    [innerElement, innerElement, true],
    [innerElement, outerElement, false],
    [outerWrapper, outerElement, true],
    [document.body, outerElement, false],
  ])("should work", (targetElement, currentElement, result) => {
    expect(
      isCurrentTargetByClassName(
        targetElement,
        currentElement,
        "editorContainer"
      )
    ).toBe(result);
  });
});
