import i18next from "i18next";
import { isCookable, evaluate } from "./evaluate";
import * as runtime from "./core/Runtime";

i18next.init({
  fallbackLng: "en",
});
i18next.addResourceBundle("en", "$app-hello", {
  HELLO: "Hello",
  COUNT_ITEMS: "Total {{count}} items",
});

jest.spyOn(runtime, "_internalApiGetCurrentContext").mockReturnValue({
  app: {
    id: "hello",
    homepage: "/hello",
    $$routeAliasMap: new Map([
      [
        "segue-target",
        {
          path: "/segue-target",
          alias: "segue-target",
        },
      ],
      [
        "mock-alias",
        {
          path: "/mock/alias",
          alias: "mock-alias",
        },
      ],
    ]),
  },
  query: new URLSearchParams("a=x&b=2&b=1"),
  match: {
    params: {
      objectId: "HOST",
    },
  },
  sys: {
    username: "tester",
  },
  flags: {
    test: true,
  },
  hash: "#readme",
  segues: {
    testSegueId: {
      target: "segue-target",
    },
  },
  storyboardContext: new Map<string, any>([
    [
      "myFreeContext",
      {
        type: "free-variable",
        value: "good",
      },
    ],
    [
      "myPropContext",
      {
        type: "brick-property",
        brick: {
          element: {
            quality: "better",
          },
        },
        prop: "quality",
      },
    ],
  ]),
} as any);

describe("isCookable", () => {
  it.each<[string, boolean]>([
    ["<% [] %>", true],
    ["", false],
    ["<%%>", false],
    ["<%[]%>", false],
    ["<% []%>", false],
    ["<%[] %>", false],
    [" <% [] %>", true],
    ["<% [] %> ", true],
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
    [" <% QUERY.a %>", "x"],
    ["<% QUERY.b %> ", "2"],
    [" <% QUERY_ARRAY.b %> ", ["2", "1"]],
    ["\n\t<% PARAMS.get('b') %>\n\t", "2"],
    ["<% PARAMS.getAll('b') %>", ["2", "1"]],
    ["<% PARAMS.toString() %>", "a=x&b=2&b=1"],
    ["<% SYS.username %>", "tester"],
    ["<% FLAGS.test %>", true],
    ["<% HASH %>", "#readme"],
    ["<% ANCHOR %>", "readme"],
    ["<% SEGUE.getUrl('testSegueId') %>", "/segue-target"],
    ["<% ALIAS.getUrl('mock-alias') %>", "/mock/alias"],
    ["<% I18N('HELLO') %>", "Hello"],
    ["<% I18N('COUNT_ITEMS', { count: 5 }) %>", "Total 5 items"],
    ["<% I18N('NOT_EXISTED') %>", "NOT_EXISTED"],
    ["<% CTX.myFreeContext %>", "good"],
    ["<% CTX.myPropContext %>", "better"],
    ["<% CTX.notExisted %>", undefined],
  ])("evaluate(%j) should return %j", (raw, result) => {
    expect(evaluate(raw)).toEqual(result);
  });

  it.each<[string, any]>([
    ["<% [] %>", []],
    ["<% EVENT.detail %>", "good"],
  ])("evaluate(%j, { event }) should return %j", (raw, result) => {
    expect(
      evaluate(raw, {
        event: new CustomEvent("something.happen", {
          detail: "good",
        }),
      })
    ).toEqual(result);
  });

  it.each<[string, any]>([
    ["<% [] %>", []],
    ["<% DATA.quality %>", "good"],
  ])("evaluate(%j, { data }) should return %j", (raw, result) => {
    expect(
      evaluate(raw, {
        data: {
          quality: "good",
        },
      })
    ).toEqual(result);
  });

  it("should work when using both `EVENT` and `DATA`", () => {
    // Simulate a transformation with `EVENT`
    const preEvaluated = evaluate("<% EVENT.detail + DATA %>", {
      data: 2,
    });
    expect(preEvaluated).toEqual({
      [Symbol.for("pre.evaluated.raw")]: "<% EVENT.detail + DATA %>",
      [Symbol.for("pre.evaluated.context")]: {
        data: 2,
      },
    });

    // Simulate an event dispatching after a transformation.
    expect(
      evaluate(preEvaluated, {
        event: new CustomEvent("something.happen", {
          detail: 3,
        }),
      })
    ).toEqual(5);
  });

  it("should work when set lazy", () => {
    const preEvaluated = evaluate(
      "<% DATA %>",
      {
        data: "<% oops %>",
      },
      {
        lazy: true,
      }
    );
    expect(preEvaluated).toEqual({
      [Symbol.for("pre.evaluated.raw")]: "<% DATA %>",
      [Symbol.for("pre.evaluated.context")]: {
        data: "<% oops %>",
      },
    });
    expect(evaluate(preEvaluated, {})).toEqual("<% oops %>");
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
