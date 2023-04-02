import { describe, test, expect } from "@jest/globals";
import {
  strictCollectMemberUsageInFunction,
  collectMemberUsageInFunction,
} from "./collectMemberUsageInFunction.js";

describe("strictCollectMemberUsageInFunction", () => {
  test("basic usage", () => {
    const used = strictCollectMemberUsageInFunction(
      {
        name: "test",
        source: `function test() {
          return FN.hello(), FN.goodbye();
        }`,
      },
      "FN"
    );
    expect([...used]).toEqual(["hello", "goodbye"]);
  });

  test("with non static usage", () => {
    expect(() => {
      strictCollectMemberUsageInFunction(
        {
          name: "test",
          source: `function test(input) {
            return FN.hello(), FN[input]();
          }`,
        },
        "FN"
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Non-static usage of FN is prohibited, check your function: "test""`
    );
  });
});

describe("collectMemberUsageInFunction", () => {
  test("basic usage", () => {
    const usage = collectMemberUsageInFunction(
      {
        name: "test",
        source: `function test() {
          return FN.hello(), FN.goodbye();
        }`,
      },
      "FN"
    );
    expect([...usage.usedProperties]).toEqual(["hello", "goodbye"]);
    expect(usage.hasNonStaticUsage).toBe(false);
  });

  test("with non static usage", () => {
    const usage = collectMemberUsageInFunction(
      {
        name: "test",
        source: `function test(input) {
          return FN.hello(), FN[input]();
        }`,
      },
      "FN"
    );
    expect([...usage.usedProperties]).toEqual(["hello"]);
    expect(usage.hasNonStaticUsage).toBe(true);
  });
});
