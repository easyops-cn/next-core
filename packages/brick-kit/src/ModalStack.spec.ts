import type { instantiateModalStack as _instantiateModalStack } from "./ModalStack";

const defaultInitialIndex = 1000;

describe("instantiateModalStack", () => {
  let instantiateModalStack: typeof _instantiateModalStack;

  beforeEach(() => {
    jest.isolateModules(() => {
      ({ instantiateModalStack } = require("./ModalStack"));
    });
  });

  test("should push a new index onto the stack and return the correct value", () => {
    const stack = instantiateModalStack();
    const result = stack.push();
    expect(result).toBe(defaultInitialIndex);
  });

  test("should increment the index correctly on multiple stack pushes", () => {
    const stack1 = instantiateModalStack();
    const stack2 = instantiateModalStack();
    const stack3 = instantiateModalStack();

    const result1 = stack1.push();
    const result2 = stack2.push();
    expect(result1).toBe(defaultInitialIndex);
    expect(result2).toBe(defaultInitialIndex + 1);

    stack1.pull();
    const result3 = stack3.push();
    expect(result3).toBe(defaultInitialIndex + 2);
  });

  test("should handle pushes without pull", () => {
    const stack = instantiateModalStack();
    const result1 = stack.push();
    const result2 = stack.push();
    expect(result1).toBe(defaultInitialIndex);
    expect(result2).toBe(defaultInitialIndex);
  });

  test("should respect param of initialIndex", () => {
    const stack = instantiateModalStack(10);
    expect(stack.push()).toBe(10);
  });
});
