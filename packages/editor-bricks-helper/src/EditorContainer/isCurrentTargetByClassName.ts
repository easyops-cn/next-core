import editorContainerStyles from "./EditorContainer.module.css";

export function isCurrentTargetByClassName(
  targetElement: HTMLElement,
  currentElement: HTMLElement
): boolean {
  // Traverse DOM from bottom to top.
  let element = targetElement;
  while (element) {
    if (element === currentElement) {
      return true;
    }
    if (
      element.classList.contains(editorContainerStyles.editorContainer) &&
      !element.classList.contains(editorContainerStyles.isTemplateInternalNode)
    ) {
      // It's not the current target if
      // matches another editor container first.
      return false;
    }
    element = element.parentElement;
  }
  return false;
}
