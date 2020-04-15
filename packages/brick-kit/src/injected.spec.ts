import {
  haveBeenInjected,
  recursiveMarkAsInjected,
  resetAllInjected,
} from "./injected";

describe("injected", () => {
  it("should work for an object", () => {
    const innerArray = ["quality", "good"];
    const innerObject = { quality: "good" };
    const object = {
      innerArray,
      innerObject,
    };
    expect(haveBeenInjected(object)).toBe(false);
    expect(haveBeenInjected(innerArray)).toBe(false);
    expect(haveBeenInjected(innerObject)).toBe(false);
    recursiveMarkAsInjected(object);
    expect(haveBeenInjected(object)).toBe(true);
    expect(haveBeenInjected(innerArray)).toBe(true);
    expect(haveBeenInjected(innerObject)).toBe(true);
    resetAllInjected();
    expect(haveBeenInjected(object)).toBe(false);
    expect(haveBeenInjected(innerArray)).toBe(false);
    expect(haveBeenInjected(innerObject)).toBe(false);
  });

  it("should work for an array", () => {
    const innerArray = ["quality", "good"];
    const innerObject = { quality: "good" };
    const array = [innerArray, innerObject];
    expect(haveBeenInjected(array)).toBe(false);
    expect(haveBeenInjected(innerArray)).toBe(false);
    expect(haveBeenInjected(innerObject)).toBe(false);
    recursiveMarkAsInjected(array);
    expect(haveBeenInjected(array)).toBe(true);
    expect(haveBeenInjected(innerArray)).toBe(true);
    expect(haveBeenInjected(innerObject)).toBe(true);
    resetAllInjected();
    expect(haveBeenInjected(array)).toBe(false);
    expect(haveBeenInjected(innerArray)).toBe(false);
    expect(haveBeenInjected(innerObject)).toBe(false);
  });

  it("should work for circular references", () => {
    const value: Record<string, any> = {};
    value.circularRef = value;
    expect(haveBeenInjected(value)).toBe(false);
    recursiveMarkAsInjected(value);
    expect(haveBeenInjected(value)).toBe(true);
  });

  it("should work for an primitive", () => {
    const value = "good";
    expect(haveBeenInjected(value)).toBe(false);
    recursiveMarkAsInjected(value);
    expect(haveBeenInjected(value)).toBe(false);
  });
});
