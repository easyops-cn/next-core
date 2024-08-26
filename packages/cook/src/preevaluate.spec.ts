import { cook } from "./cook.js";
import {
  isEvaluable,
  preevaluate,
  shouldAllowRecursiveEvaluations,
  isTrackAll,
  clearExpressionASTCache,
} from "./preevaluate.js";

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
    ["<%~ [] %> ", true],
    ["<%~[]%> ", false],
    ["<% ~[]%> ", false],
    ["<%= [] %> ", true],
    ["<%=[]%> ", false],
    ["<%=[] %> ", false],
    ["<%= []%> ", false],
  ])("isEvaluable(%j) should return %j", (raw, cookable) => {
    expect(isEvaluable(raw)).toBe(cookable);
  });
});

describe("preevaluate", () => {
  beforeEach(() => {
    clearExpressionASTCache();
  });

  it("should work", () => {
    const { attemptToVisitGlobals, ...restResult } = preevaluate(
      "<% DATA, EVENT.detail %>"
    );
    expect(Array.from(attemptToVisitGlobals)).toEqual(["DATA", "EVENT"]);
    expect(restResult).toMatchObject({
      source: "DATA, EVENT.detail",
      prefix: "<% ",
      suffix: " %>",
    });
  });

  it("should work with the recursive flag", () => {
    const { attemptToVisitGlobals, ...restResult } = preevaluate(
      "<%~ DATA, EVENT.detail %>"
    );
    expect(Array.from(attemptToVisitGlobals)).toEqual(["DATA", "EVENT"]);
    expect(restResult).toMatchObject({
      source: "DATA, EVENT.detail",
      prefix: "<%~ ",
      suffix: " %>",
    });
  });

  it("should isolate regexp", () => {
    const precooked1 = preevaluate(
      "<% ((r) => (r.exec('abc'), r.lastIndex))(/\\w/g) %>",
      { cache: true }
    );
    const result1 = cook(precooked1.expression, precooked1.source);
    expect(result1).toBe(1);

    const precooked2 = preevaluate(
      "<%= ((r) => (r.exec('abc'), r.lastIndex))(/\\w/g) %>",
      { cache: true }
    );
    const result2 = cook(precooked2.expression, precooked2.source);
    expect(result2).toBe(1);
  });

  it("should throw SyntaxError", () => {
    expect(() => {
      preevaluate("<% DATA : EVENT %>");
    }).toThrowErrorMatchingInlineSnapshot(`"Unexpected token (1:5)"`);
  });
});

describe("shouldAllowRecursiveEvaluations", () => {
  it("should return false", () => {
    expect(shouldAllowRecursiveEvaluations("<% DATA %>")).toBe(false);
  });

  it("should return true", () => {
    expect(shouldAllowRecursiveEvaluations("<%~ DATA %>")).toBe(true);
  });
});

describe("isTrackAll", () => {
  it.each<[string, boolean]>([
    ["<%= CTX.a %>", true],
    [
      `<%=
          CTX.a
        %>`,
      true,
    ],
    [
      `<%=
          CTX.a%>`,
      false,
    ],
    [
      `<%
          CTX.a
        %>`,
      false,
    ],
    [
      `<%=
          CTX.a%>`,
      false,
    ],
    [
      `<%=CTX.a
        %>`,
      false,
    ],
  ])("should work", (params, result) => {
    expect(isTrackAll(params)).toBe(result);
  });
});
