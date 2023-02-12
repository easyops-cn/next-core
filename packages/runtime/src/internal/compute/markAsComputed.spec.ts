import { symbolForTplStateStoreId } from "../CustomTemplates/constants.js";
import {
  cloneDeepWithComputedMark,
  haveBeenComputed,
  markAsComputed,
  resetAllComputed,
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
    expect(haveBeenComputed(object)).toBe(false);
    expect(haveBeenComputed(innerArray)).toBe(false);
    expect(haveBeenComputed(innerObject)).toBe(false);
    markAsComputed(object);
    expect(haveBeenComputed(object)).toBe(true);
    expect(haveBeenComputed(innerArray)).toBe(true);
    expect(haveBeenComputed(innerObject)).toBe(true);
    resetAllComputed();
    expect(haveBeenComputed(object)).toBe(false);
    expect(haveBeenComputed(innerArray)).toBe(false);
    expect(haveBeenComputed(innerObject)).toBe(false);
  });

  it("should work for an array", () => {
    const innerArray = ["quality", "good"];
    const innerObject = { quality: "good" };
    const array = [innerArray, innerObject];
    expect(haveBeenComputed(array)).toBe(false);
    expect(haveBeenComputed(innerArray)).toBe(false);
    expect(haveBeenComputed(innerObject)).toBe(false);
    markAsComputed(array);
    expect(haveBeenComputed(array)).toBe(true);
    expect(haveBeenComputed(innerArray)).toBe(true);
    expect(haveBeenComputed(innerObject)).toBe(true);
    resetAllComputed();
    expect(haveBeenComputed(array)).toBe(false);
    expect(haveBeenComputed(innerArray)).toBe(false);
    expect(haveBeenComputed(innerObject)).toBe(false);
  });

  it("should ignore properties of elements", () => {
    const element = document.createElement("div") as any;
    element.objectProp = {};
    expect(haveBeenComputed(element)).toBe(false);
    markAsComputed(element);
    expect(haveBeenComputed(element)).toBe(true);
    expect(haveBeenComputed(element.objectProp)).toBe(false);
  });

  it("should work for circular references", () => {
    const value: Record<string, any> = {};
    value.circularRef = value;
    expect(haveBeenComputed(value)).toBe(false);
    markAsComputed(value);
    expect(haveBeenComputed(value)).toBe(true);
  });

  it("should work for an primitive", () => {
    const value = "good";
    expect(haveBeenComputed(value)).toBe(false);
    markAsComputed(value);
    expect(haveBeenComputed(value)).toBe(false);
  });
});

describe("cloneDeepWithComputedMark", () => {
  it("should work", () => {
    const innerArray = ["quality", "good"];
    const innerObject = {
      quality: "good",
      useBrick: [
        {
          quality: "good",
          useBrick: {
            brick: "a",
            [symbolForTplStateStoreId]: "tpl-1",
          },
        },
        {
          quality: "bad",
          useBrick: {
            brick: "b",
            [symbolForTplStateStoreId]: "tpl-1",
          },
        },
      ],
    };
    const object = {
      innerArray,
      innerObject,
    };

    const cloneOfObject1 = cloneDeepWithComputedMark(object);
    expect(cloneOfObject1).toEqual(object);
    expect(cloneOfObject1).not.toBe(object);
    expect(cloneOfObject1.innerArray).not.toBe(object.innerArray);
    expect(cloneOfObject1.innerObject).not.toBe(object.innerObject);
    expect(haveBeenComputed(cloneOfObject1)).toBe(false);
    expect(haveBeenComputed(cloneOfObject1.innerArray)).toBe(false);
    expect(haveBeenComputed(cloneOfObject1.innerObject)).toBe(false);

    markAsComputed(object);

    const cloneOfObject2 = cloneDeepWithComputedMark(object);
    expect(cloneOfObject1).toEqual(object);
    expect(cloneOfObject1).not.toBe(object);
    expect(cloneOfObject1.innerArray).not.toBe(object.innerArray);
    expect(cloneOfObject1.innerObject).not.toBe(object.innerObject);
    expect(haveBeenComputed(cloneOfObject2)).toBe(true);
    expect(haveBeenComputed(cloneOfObject2.innerArray)).toBe(true);
    expect(haveBeenComputed(cloneOfObject2.innerObject)).toBe(true);
  });
});
