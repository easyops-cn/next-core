import { describe, test, expect } from "@jest/globals";
import { collectMemberUsageInFunction } from "./collectMemberUsageInFunction.js";

const consoleError = jest.spyOn(console, "error");

describe("collectMemberUsageInFunction", () => {
  test("basic usage", () => {
    const used = collectMemberUsageInFunction(
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
      collectMemberUsageInFunction(
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

  test("parse error", () => {
    consoleError.mockReturnValueOnce();
    const used = collectMemberUsageInFunction(
      {
        name: "test",
        source: `function test(input) {
          return abc - ;
        }`,
      },
      "FN"
    );
    expect([...used]).toEqual([]);
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith(
      'Parse storyboard function "test" failed:',
      expect.anything()
    );
  });
});

describe("collectMemberUsageInFunction with silent errors", () => {
  test("basic usage", () => {
    const used = collectMemberUsageInFunction(
      {
        name: "test",
        source: `function test() {
          return FN.hello(), FN.goodbye();
        }`,
      },
      "FN",
      true
    );
    expect([...used]).toEqual(["hello", "goodbye"]);
  });

  test("with non static usage", () => {
    const used = collectMemberUsageInFunction(
      {
        name: "test",
        source: `function test(input) {
          return FN.hello(), FN[input]();
        }`,
      },
      "FN",
      true
    );
    expect([...used]).toEqual(["hello"]);
  });

  test("parse error", () => {
    const used = collectMemberUsageInFunction(
      {
        name: "test",
        source: `function test(input) {
          return abc - ;
        }`,
      },
      "FN",
      true
    );
    expect([...used]).toEqual([]);
    expect(consoleError).not.toBeCalled();
  });
});
