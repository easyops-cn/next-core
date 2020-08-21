import { isEvaluable, preevaluate } from "./preevaluate";

describe("isEvaluable", () => {
  it.each<[string, boolean]>([
    ["<% [] %>", true],
    ["", false],
    ["<%%>", false],
    ["<%[]%>", false],
    ["<% []%>", false],
    ["<%[] %>", false],
    [" <% [] %>", true],
    ["<% [] %> ", true],
  ])("isEvaluable(%j) should return %j", (raw, cookable) => {
    expect(isEvaluable(raw)).toBe(cookable);
  });
});

describe("preevaluate", () => {
  it("should work", () => {
    const result = preevaluate("<% DATA, EVENT.detail %>");
    expect(Array.from(result.attemptToVisitGlobals)).toEqual(["DATA", "EVENT"]);
  });

  it("should throw SyntaxError", () => {
    expect(() => {
      preevaluate("<% DATA : EVENT %>");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unexpected token (1:5), in \\"<% DATA : EVENT %>\\""`
    );
  });
});
