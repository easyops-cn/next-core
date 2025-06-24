import { describe, test, expect, jest } from "@jest/globals";
import { traverseStoryboardExpressions } from "./traverse.js";
import {
  MemberUsage,
  beforeVisitGlobalMember,
} from "./beforeVisitGlobalMember.js";

describe("traverseStoryboardExpressions", () => {
  test("when options is string", () => {
    const usage: MemberUsage = {
      usedProperties: new Set(),
      hasNonStaticUsage: false,
    };
    const beforeVisitGlobal = beforeVisitGlobalMember(usage, "CTX");

    traverseStoryboardExpressions(
      ["<% CTX.abc %>", '<% CTX["xyz"] %>'],
      beforeVisitGlobal,
      "CTX"
    );

    expect([...usage.usedProperties]).toEqual(["abc", "xyz"]);
    expect(usage.hasNonStaticUsage).toBe(false);
  });

  test("full usage", () => {
    const usage: MemberUsage = {
      usedProperties: new Set(),
      hasNonStaticUsage: false,
    };
    const beforeVisitGlobal = beforeVisitGlobalMember(usage, "CTX");

    const nest: { nest?: unknown } = {};
    nest.nest = nest;
    const data = [
      "<% CTX.abc %>",
      "<% STATE.rst %>",
      "CTX.opq",
      "<% CTX[xyz] %>",
      "<% CTX.lmn. %>",
      nest,
    ];

    const visitNotMatchedExpressionString = jest.fn();
    const visitNonExpressionString = jest.fn();
    const visitObject = jest.fn();
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
      // Do nothing
    });

    traverseStoryboardExpressions(data, beforeVisitGlobal, {
      matchExpressionString(v) {
        return v.includes("CTX");
      },
      visitNotMatchedExpressionString,
      visitNonExpressionString,
      visitObject,
    });

    expect([...usage.usedProperties]).toEqual(["abc"]);
    expect(usage.hasNonStaticUsage).toBe(true);

    expect(visitNotMatchedExpressionString).toHaveBeenCalledTimes(1);
    expect(visitNotMatchedExpressionString).toHaveBeenCalledWith(
      "<% STATE.rst %>"
    );
    expect(visitNonExpressionString).toHaveBeenCalledTimes(1);
    expect(visitNonExpressionString).toHaveBeenCalledWith("CTX.opq");
    expect(visitObject).toHaveBeenCalledTimes(2);
    expect(visitObject).toHaveBeenCalledWith(data);
    expect(visitObject).toHaveBeenCalledWith(nest);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Parse storyboard expression failed"),
      expect.anything()
    );
  });
});
