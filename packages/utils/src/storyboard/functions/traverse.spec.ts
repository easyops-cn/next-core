import { describe, test, expect } from "@jest/globals";
import { traverseStoryboardFunctions } from "./traverse.js";
import {
  beforeVisitGlobalMember,
  type MemberUsage,
} from "../expressions/beforeVisitGlobalMember.js";

describe("traverseStoryboardFunctions", () => {
  test("with matchSource", () => {
    const usage: MemberUsage = {
      usedProperties: new Set(),
      hasNonStaticUsage: false,
    };
    const beforeVisitGlobal = jest.fn((node, parent) => {
      return beforeVisitGlobalMember(usage, "FN")(node, parent);
    });

    traverseStoryboardFunctions(
      [
        {
          name: "test",
          source: `function test() {
            return FN.abc();
          }`,
        },
        {
          name: "ignore",
          source: `function ignore() {
            return abc();
          }`,
        },
      ],
      beforeVisitGlobal,
      {
        matchSource(source) {
          return source.includes("FN");
        },
      }
    );

    expect([...usage.usedProperties]).toEqual(["abc"]);
    expect(usage.hasNonStaticUsage).toBe(false);
    expect(beforeVisitGlobal).toBeCalledTimes(1);
  });

  test("without matchSource", () => {
    const usage: MemberUsage = {
      usedProperties: new Set(),
      hasNonStaticUsage: false,
    };
    const beforeVisitGlobal = jest.fn((node, parent) => {
      return beforeVisitGlobalMember(usage, "FN")(node, parent);
    });

    traverseStoryboardFunctions(
      [
        {
          name: "test",
          source: `function test() {
            return FN.abc();
          }`,
        },
        {
          name: "ignore",
          source: `function ignore() {
            return abc();
          }`,
        },
      ],
      beforeVisitGlobal
    );

    expect([...usage.usedProperties]).toEqual(["abc"]);
    expect(usage.hasNonStaticUsage).toBe(false);
    expect(beforeVisitGlobal).toBeCalledTimes(2);
  });
});
