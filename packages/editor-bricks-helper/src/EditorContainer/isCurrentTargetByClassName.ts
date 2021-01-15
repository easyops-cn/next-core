export function isCurrentTargetByClassName(
  targetElement: HTMLElement,
  currentElement: HTMLElement,
  className: string
): boolean {
  // Traverse DOM from bottom to top.
  let element = targetElement;
  while (element) {
    if (element === currentElement) {
      return true;
    }
    if (element.classList.contains(className)) {
      // It's not the current target if
      // matches another editor container first.
      return false;
    }
    element = element.parentElement;
  }
  return false;
}
