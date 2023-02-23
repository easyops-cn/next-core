import { describe, it, expect } from "@jest/globals";
import {
  isPrimitiveType,
  isPropertyType,
  isModelType,
  expectDocVersion,
  getRealType,
  extractProviderContract,
} from "./utils.js";

jest.mock("./loaders/__dirname.js");

describe("sdk-scripts utils", () => {
  describe("isPrimitiveType should work", () => {
    const cases: [string, boolean][] = [
      ["int", false],
      ["float", false],
      ["bool", false],
      ["number", true],
      ["string", true],
      ["boolean", true],
    ];

    it.each(cases)("isPrimitiveType(%s) should be %s", (type, expected) => {
      expect(isPrimitiveType(type)).toBe(expected);
    });
  });

  describe("isPropertyType should work", () => {
    const cases: [string, boolean][] = [
      ['type["field"]', true],
      ["type", false],
    ];

    it.each(cases)("isPropertyType(%s) should be %s", (type, expected) => {
      expect(isPropertyType(type)).toBe(expected);
    });
  });

  describe("getRealType should work", () => {
    const cases: [
      { type: string; enum?: string[] | number[] },
      { type: string; isArray: boolean; enum?: string[] | number[] }
    ][] = [
      [{ type: "number" }, { type: "number", isArray: false }],
      [{ type: "int[]" }, { type: "number", isArray: true }],
      [{ type: "email" }, { type: "string", isArray: false }],
      [
        { type: "email", enum: ["a@b.com"] },
        { type: "string", isArray: false },
      ],
      [
        { type: "env_type" },
        { type: "number", isArray: false, enum: [1, 3, 7, 15] },
      ],
    ];

    it.each(cases)("getRealType(%s) should be %j", (doc, expected) => {
      expect(getRealType(doc)).toEqual(expected);
    });
  });

  describe("isModelType should work", () => {
    const cases: [string, boolean][] = [
      ["number", false],
      ["object", false],
      ["pkg", true],
    ];

    it.each(cases)("isModelType(%s) should be %s", (type, expected) => {
      expect(isModelType(type)).toBe(expected);
    });
  });

  describe("extractProviderContract should work", () => {
    const cases = [
      [
        {
          serviceSeg: "cmdb",
          modelSeg: "instance",
          modelI18nMap: new Map([["description", { en: "cmdb", zh: "cmdb" }]]),
        },
        {
          name: "postSearch",
          version: "1.0.0",
          description: "search instance",
          endpoint: {
            method: "get",
            url: "api/cmdb",
          },
          import: [],
          request: {
            name: "id",
            type: "string",
          },
          response: {
            type: "object",
            fields: [
              {
                name: "code",
                type: "number",
              },
            ],
          },
        },
        "instance",
        {
          contract: "cmdb.instance.postSearch",
          name: "postSearch",
          version: "1.0.0",
          category: {
            en: "cmdb",
            zh: "cmdb",
          },
          description: "search instance",
          endpoint: {
            method: "get",
            url: "api/cmdb",
          },
          import: [],
          request: {
            name: "id",
            type: "string",
          },
          response: {
            type: "object",
            fields: [
              {
                name: "code",
                type: "number",
              },
            ],
          },
        },
      ],
    ];

    it.each(cases)(
      "extractProviderContract(%s, %s, %s) should be %s",
      (context, doc, modelSeg, result) => {
        expect(extractProviderContract(context, doc, modelSeg)).toEqual(result);
      }
    );
  });

  it("expectDocVersion should work", () => {
    expect(() => expectDocVersion({ _version_: "1.0" })).toThrow();
    expect(() => expectDocVersion({ _version_: "2.0" })).not.toThrow();
    expect(() => expectDocVersion({ _version_: "2.1.1" })).not.toThrow();
    expect(() => expectDocVersion({ _version_: "2.2" })).not.toThrow();
    expect(() => expectDocVersion({ _version_: "2.3" })).toThrow();
    expect(() => expectDocVersion({ _version_: 2 })).not.toThrow();
    expect(() => expectDocVersion({ _version_: 2.1 })).not.toThrow();
    expect(() => expectDocVersion({ _version_: 2.4 })).toThrow();
  });
});
