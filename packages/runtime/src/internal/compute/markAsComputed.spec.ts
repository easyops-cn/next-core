import {
  hasBeenComputed,
  markAsComputed,
  resetAllComputedMarks,
} from "./markAsComputed.js";

describe("injected", () => {
  it("should work for an object", () => {
    const innerArray = ["quality", "good"];
    const innerObject = { quality: "good" };
    const object = Object.create(null);
    Object.assign(object, {
      innerArray,
      innerObject,
    });
    expect(hasBeenComputed(object)).toBe(false);
    expect(hasBeenComputed(innerArray)).toBe(false);
    expect(hasBeenComputed(innerObject)).toBe(false);
    markAsComputed(object);
    expect(hasBeenComputed(object)).toBe(true);
    expect(hasBeenComputed(innerArray)).toBe(true);
    expect(hasBeenComputed(innerObject)).toBe(true);
    resetAllComputedMarks();
    expect(hasBeenComputed(object)).toBe(false);
    expect(hasBeenComputed(innerArray)).toBe(false);
    expect(hasBeenComputed(innerObject)).toBe(false);
  });

  it("should work for an array", () => {
    const innerArray = ["quality", "good"];
    const innerObject = { quality: "good" };
    const array = [innerArray, innerObject];
    expect(hasBeenComputed(array)).toBe(false);
    expect(hasBeenComputed(innerArray)).toBe(false);
    expect(hasBeenComputed(innerObject)).toBe(false);
    markAsComputed(array);
    expect(hasBeenComputed(array)).toBe(true);
    expect(hasBeenComputed(innerArray)).toBe(true);
    expect(hasBeenComputed(innerObject)).toBe(true);
    resetAllComputedMarks();
    expect(hasBeenComputed(array)).toBe(false);
    expect(hasBeenComputed(innerArray)).toBe(false);
    expect(hasBeenComputed(innerObject)).toBe(false);
  });

  it("should ignore properties of elements", () => {
    const element = document.createElement("div") as any;
    element.objectProp = {};
    expect(hasBeenComputed(element)).toBe(false);
    markAsComputed(element);
    expect(hasBeenComputed(element)).toBe(true);
    expect(hasBeenComputed(element.objectProp)).toBe(false);
  });

  it("should work for circular references", () => {
    const value: Record<string, any> = {};
    value.circularRef = value;
    expect(hasBeenComputed(value)).toBe(false);
    markAsComputed(value);
    expect(hasBeenComputed(value)).toBe(true);
  });

  it("should work for an primitive", () => {
    const value = "good";
    expect(hasBeenComputed(value)).toBe(false);
    markAsComputed(value);
    expect(hasBeenComputed(value)).toBe(false);
  });
});
