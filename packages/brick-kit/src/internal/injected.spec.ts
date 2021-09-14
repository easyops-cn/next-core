import { symbolForTplContextId } from "../core/CustomTemplates/constants";
import {
  cloneDeepWithInjectedMark,
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

  it("should ignore properties of elements", () => {
    const element = document.createElement("div") as any;
    element.objectProp = {};
    expect(haveBeenInjected(element)).toBe(false);
    recursiveMarkAsInjected(element);
    expect(haveBeenInjected(element)).toBe(true);
    expect(haveBeenInjected(element.objectProp)).toBe(false);
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

describe("cloneDeepWithInjectedMark", () => {
  it("should work", () => {
    const innerArray = ["quality", "good"];
    const innerObject = {
      quality: "good",
      useBrick: [
        {
          quality: "good",
          useBrick: {
            brick: "a",
            [symbolForTplContextId]: "tpl-1",
          },
        },
        {
          quality: "bad",
          useBrick: {
            brick: "b",
            [symbolForTplContextId]: "tpl-1",
          },
        },
      ],
    };
    const object = {
      innerArray,
      innerObject,
    };

    const cloneOfObject1 = cloneDeepWithInjectedMark(object);
    expect(cloneOfObject1).toEqual(object);
    expect(cloneOfObject1).not.toBe(object);
    expect(cloneOfObject1.innerArray).not.toBe(object.innerArray);
    expect(cloneOfObject1.innerObject).not.toBe(object.innerObject);
    expect(haveBeenInjected(cloneOfObject1)).toBe(false);
    expect(haveBeenInjected(cloneOfObject1.innerArray)).toBe(false);
    expect(haveBeenInjected(cloneOfObject1.innerObject)).toBe(false);

    recursiveMarkAsInjected(object);

    const cloneOfObject2 = cloneDeepWithInjectedMark(object);
    expect(cloneOfObject1).toEqual(object);
    expect(cloneOfObject1).not.toBe(object);
    expect(cloneOfObject1.innerArray).not.toBe(object.innerArray);
    expect(cloneOfObject1.innerObject).not.toBe(object.innerObject);
    expect(haveBeenInjected(cloneOfObject2)).toBe(true);
    expect(haveBeenInjected(cloneOfObject2.innerArray)).toBe(true);
    expect(haveBeenInjected(cloneOfObject2.innerObject)).toBe(true);
  });
});
