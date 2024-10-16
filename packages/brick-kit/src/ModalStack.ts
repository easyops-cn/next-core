const stack: number[] = [];

export interface ModalStack {
  push: () => number;
  pull: () => void;
}

export function instantiateModalStack(initialIndex = 1000): ModalStack {
  let index = -1;
  const pull = (): void => {
    if (index > -1) {
      const found = stack.indexOf(index);
      // Assert: found should always be greater than -1
      // istanbul ignore else
      if (found > -1) {
        stack.splice(found, 1);
      }
    }
  };
  const push = (): number => {
    // Handle pushes without pull
    pull();
    // Find the next available index
    index = (stack[stack.length - 1] ?? -1) + 1;
    stack.push(index);
    return index + initialIndex;
  };
  return { push, pull };
}
