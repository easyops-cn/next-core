import i18next from "i18next";
import { evaluate } from "./evaluate";
import * as runtime from "./core/Runtime";
import { registerCustomProcessor } from "./core/exports";
import { devtoolsHookEmit } from "./devtools";

jest.mock("./devtools");

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
  images: [
    {
      name: "a.jpg",
      url: "api/gateway/object_store.object_store.GetObject/a.jpg",
    },
  ],
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

function objectEntries(object: Record<string, any>): [string, any][] {
  return Object.entries(object);
}
registerCustomProcessor("brickKit.objectEntries", objectEntries);

describe("evaluate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

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
    [
      "<% IMAGES.getUrl('a.jpg') %>",
      "api/gateway/object_store.object_store.GetObject/a.jpg",
    ],
    ["<% IMAGES.getUrl('none.jpg') %>", undefined],
    ["<% I18N('HELLO') %>", "Hello"],
    ["<% I18N('COUNT_ITEMS', { count: 5 }) %>", "Total 5 items"],
    ["<% I18N('NOT_EXISTED') %>", "NOT_EXISTED"],
    ["<% CTX.myFreeContext %>", "good"],
    ["<% CTX.myPropContext %>", "better"],
    ["<% CTX.notExisted %>", undefined],
    [
      "<% PROCESSORS.brickKit.objectEntries({quality: 'good'}) %>",
      [["quality", "good"]],
    ],
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

  it("should emit for re-evaluation", () => {
    evaluate("<% [] %>", {}, { isReEvaluation: true, evaluationId: 1 });
    expect(devtoolsHookEmit).toBeCalledWith("re-evaluation", {
      id: 1,
      detail: { raw: "<% [] %>", context: {}, result: [] },
    });
  });

  it("should emit syntax error for re-evaluation", () => {
    evaluate("<% a : b %>", {}, { isReEvaluation: true, evaluationId: 1 });
    expect(devtoolsHookEmit).toBeCalledWith("re-evaluation", {
      id: 1,
      detail: { raw: "<% a : b %>", context: {} },
      error: 'Unexpected token (1:2), in "<% a : b %>"',
    });
  });

  it("should emit evaluation error for re-evaluation", () => {
    evaluate("<% any %>", {}, { isReEvaluation: true, evaluationId: 1 });
    expect(devtoolsHookEmit).toBeCalledWith("re-evaluation", {
      id: 1,
      detail: { raw: "<% any %>", context: {} },
      error: 'any is not defined, in "<% any %>"',
    });
  });

  it("should emit for invalid code of re-evaluation", () => {
    evaluate("[]", {}, { isReEvaluation: true, evaluationId: 1 });
    expect(devtoolsHookEmit).toBeCalledWith("re-evaluation", {
      id: 1,
      detail: { raw: "[]", context: {} },
      error: "Invalid evaluation code",
    });
  });

  it("should throw if contains type error", () => {
    expect(() =>
      evaluate("<% [].oops() %>")
    ).toThrowErrorMatchingInlineSnapshot(
      `"[].oops is not a function, in \\"<% [].oops() %>\\""`
    );
  });

  it("should throw if contains syntax error", () => {
    expect(() => evaluate("<% oops( %>")).toThrowErrorMatchingInlineSnapshot(
      `"Unexpected token (1:5), in \\"<% oops( %>\\""`
    );
  });
});
