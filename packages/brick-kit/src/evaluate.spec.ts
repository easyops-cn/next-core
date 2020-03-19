import { isCookable, evaluate } from "./evaluate";
import * as runtime from "./core/Runtime";

jest.spyOn(runtime, "_internalApiGetCurrentContext").mockReturnValue({
  app: { homepage: "/hello" },
  query: new URLSearchParams("a=x&b=2&b=1"),
  match: {
    params: {
      objectId: "HOST"
    }
  },
  sys: {
    username: "tester"
  },
  flags: {
    test: true
  },
  hash: "#readme"
} as any);

describe("isCookable", () => {
  it.each<[string, boolean]>([
    ["<% [] %>", true],
    ["", false],
    ["<%%>", false],
    ["<%[]%>", false],
    ["<% []%>", false],
    ["<%[] %>", false],
    [" <% [] %>", false],
    ["<% [] %> ", false]
  ])("isCookable(%j) should return %j", (raw, cookable) => {
    expect(isCookable(raw)).toBe(cookable);
  });
});

describe("evaluate", () => {
  it.each<[string, any]>([
    ["<% [] %>", []],
    ["<% EVENT.detail %>", "<% EVENT.detail %>"],
    ["<% DATA.cellData %>", "<% DATA.cellData %>"],
    ["<% APP.homepage %>", "/hello"],
    ["<% PATH.objectId %>", "HOST"],
    ["<% QUERY.a %>", "x"],
    ["<% QUERY.b %>", "2"],
    ["<% QUERY_ARRAY.b %>", ["2", "1"]],
    ["<% PARAMS.get('b') %>", "2"],
    ["<% PARAMS.getAll('b') %>", ["2", "1"]],
    ["<% PARAMS.toString() %>", "a=x&b=2&b=1"],
    ["<% SYS.username %>", "tester"],
    ["<% FLAGS.test %>", true],
    ["<% HASH %>", "#readme"],
    ["<% ANCHOR %>", "readme"]
  ])("evaluate(%j) should return %j", (raw, result) => {
    expect(evaluate(raw)).toEqual(result);
  });

  it.each<[string, any]>([
    ["<% [] %>", []],
    ["<% EVENT.detail %>", "good"]
  ])("evaluate(%j, { event }) should return %j", (raw, result) => {
    expect(
      evaluate(raw, {
        event: new CustomEvent("something.happen", {
          detail: "good"
        })
      })
    ).toEqual(result);
  });

  it.each<[string, any]>([
    ["<% [] %>", []],
    ["<% DATA.quality %>", "good"]
  ])("evaluate(%j, { data }) should return %j", (raw, result) => {
    expect(
      evaluate(raw, {
        data: {
          quality: "good"
        }
      })
    ).toEqual(result);
  });

  it("should throw if use both `EVENT` and `DATA`", () => {
    expect(() =>
      evaluate("<% EVENT.detail + DATA %>")
    ).toThrowErrorMatchingInlineSnapshot(
      `"You can't use both \`EVENT\` and \`DATA\`"`
    );
  });

  it("should throw if contains syntax error", () => {
    expect(() => evaluate("<% oops( %>")).toThrowErrorMatchingInlineSnapshot(
      `"Unexpected token (1:5), in \\"<% oops( %>\\""`
    );
  });

  it("should throw if contains type error", () => {
    expect(() =>
      evaluate("<% [].oops() %>")
    ).toThrowErrorMatchingInlineSnapshot(
      `"[].oops is not a function, in \\"<% [].oops() %>\\""`
    );
  });
});
