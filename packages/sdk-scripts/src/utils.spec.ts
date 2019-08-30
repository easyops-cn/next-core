import {
  isPrimitiveType,
  isPropertyType,
  isModelType,
  expectDocVersion,
  getRealType
} from "./utils";

describe("sdk-scripts utils", () => {
  describe("isPrimitiveType should work", () => {
    const cases: [string, boolean][] = [
      ["int", false],
      ["float", false],
      ["bool", false],
      ["number", true],
      ["string", true],
      ["boolean", true]
    ];

    it.each(cases)("isPrimitiveType(%s) should be %s", (type, expected) => {
      expect(isPrimitiveType(type)).toBe(expected);
    });
  });

  describe("isPropertyType should work", () => {
    const cases: [string, boolean][] = [
      ['type["field"]', true],
      ["type", false]
    ];

    it.each(cases)("isPropertyType(%s) should be %s", (type, expected) => {
      expect(isPropertyType(type)).toBe(expected);
    });
  });

  describe("getRealType should work", () => {
    const cases: [string, { type: string; isArray: boolean }][] = [
      ["number", { type: "number", isArray: false }],
      ["int[]", { type: "number", isArray: true }],
      ["email", { type: "string", isArray: false }]
    ];

    it.each(cases)("getRealType(%s) should be %j", (type, expected) => {
      expect(getRealType(type)).toEqual(expected);
    });
  });

  describe("isModelType should work", () => {
    const cases: [string, boolean][] = [
      ["number", false],
      ["object", false],
      ["pkg", true]
    ];

    it.each(cases)("isModelType(%s) should be %s", (type, expected) => {
      expect(isModelType(type)).toBe(expected);
    });
  });

  it("expectDocVersion should work", () => {
    expect(() => expectDocVersion({ _version_: "1.0" })).toThrow();
    expect(() => expectDocVersion({ _version_: "2.0" })).not.toThrow();
    expect(() => expectDocVersion({ _version_: "2.2" })).not.toThrow();
    expect(() => expectDocVersion({ _version_: "2.3" })).toThrow();
  });
});
