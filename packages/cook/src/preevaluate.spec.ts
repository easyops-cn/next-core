import {
  isEvaluable,
  isTrackAll,
  preevaluate,
  shouldAllowRecursiveEvaluations,
  isSnippetEvaluations,
} from "./preevaluate";

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
    ["<%! [] %>", true],
    ["<%@ [] %>", true],
  ])("isEvaluable(%j) should return %j", (raw, cookable) => {
    expect(isEvaluable(raw)).toBe(cookable);
  });
});

describe("preevaluate", () => {
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

describe("isSnippetEvaluations", () => {
  it.each([
    ["<%! CTX.a %>", true],
    ["<%@ STATE.a %>", true],
  ])("should work", (params, result) => {
    expect(isSnippetEvaluations(params)).toEqual(result);
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
