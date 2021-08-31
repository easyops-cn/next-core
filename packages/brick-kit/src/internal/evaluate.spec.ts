import i18next from "i18next";
import {
  evaluate,
  PreEvaluated,
  shouldDismissRecursiveMarkingInjected,
} from "./evaluate";
import * as runtime from "../core/Runtime";
import { registerCustomProcessor } from "../core/exports";
import { devtoolsHookEmit } from "./devtools";
import { checkPermissions } from "./checkPermissions";
import { getItemFactory } from "./Storage";
import { getRuntime } from "../runtime";
import { getStoryboardFunctions } from "../core/StoryboardFunctions";

jest.mock("./devtools");
jest.mock("../runtime");
jest.mock("./checkPermissions");
jest.mock("./Storage");
jest.mock("../core/StoryboardFunctions");

(getStoryboardFunctions as jest.Mock).mockReturnValue({
  sayHello(name: string) {
    return `Hello, ${name}`;
  },
});

i18next.init({
  fallbackLng: "en",
});
i18next.addResourceBundle("en", "$app-hello", {
  HELLO: "Hello",
  COUNT_ITEMS: "Total {{count}} items",
});
i18next.addResourceBundle("en", "$app-hola", {
  HELLO: "Hola",
});

jest.spyOn(console, "warn").mockImplementation(() => void 0);

(
  getItemFactory as jest.MockedFunction<typeof getItemFactory>
).mockImplementation(() => {
  return () => ({ id: "mockId" });
});

(
  checkPermissions as jest.MockedFunction<typeof checkPermissions>
).mockImplementation((...actions) => {
  return !actions.includes("my:action-b");
});

const mockInstalledApps = ["my-app-id"];
(getRuntime as jest.Mock).mockReturnValue({
  hasInstalledApp(appId: string) {
    return mockInstalledApps.includes(appId);
  },
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
  storyboardContext: new Map<string, unknown>([
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

describe("shouldDismissRecursiveMarkingInjected", () => {
  it("should work with string", () => {
    expect(shouldDismissRecursiveMarkingInjected("<% DATA %>")).toBe(false);
    expect(shouldDismissRecursiveMarkingInjected("<%~ DATA %>")).toBe(true);
  });

  it("should work with pre-evaluated", () => {
    expect(
      shouldDismissRecursiveMarkingInjected({
        [Symbol.for("pre.evaluated.raw")]: "<% DATA %>",
        [Symbol.for("pre.evaluated.context")]: {},
      } as unknown as PreEvaluated)
    ).toBe(false);
    expect(
      shouldDismissRecursiveMarkingInjected({
        [Symbol.for("pre.evaluated.raw")]: "<%~ DATA %>",
        [Symbol.for("pre.evaluated.context")]: {},
      } as unknown as PreEvaluated)
    ).toBe(true);
  });
});

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
    ["<% I18N_TEXT({ en: 'hello', zh: '你好' }) %>", "你好"],
    ["<% CTX.myFreeContext %>", "good"],
    ["<% CTX.myPropContext %>", "better"],
    ["<% CTX.notExisted %>", undefined],
    [
      "<% PROCESSORS.brickKit.objectEntries({quality: 'good'}) %>",
      [["quality", "good"]],
    ],
    ["<% PERMISSIONS.check('my:action-a') %>", true],
    ["<% PERMISSIONS.check('my:action-b') %>", false],
    ["<% LOCAL_STORAGE.getItem('visit-history') %>", { id: "mockId" }],
    ["<% SESSION_STORAGE.getItem('visit-history') %>", { id: "mockId" }],
    ["<% INSTALLED_APPS.has('my-app-id') %>", true],
    ["<% INSTALLED_APPS.has('my-another-app-id') %>", false],
    ["<% FN.sayHello('world') %>", "Hello, world"],
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

  it.each<[string, any]>([
    ["<% [] %>", []],
    ["<% TPL.quality %>", "good"],
  ])("evaluate(%j, { getTplVariables }) should return %j", (raw, result) => {
    expect(
      evaluate(raw, {
        getTplVariables: () => ({
          quality: "good",
        }),
      })
    ).toEqual(result);
  });

  it("should work when using both `EVENT` and `DATA`", () => {
    // Simulate a transformation with `EVENT`
    const preEvaluated = evaluate("<% EVENT.detail + DATA %>", {
      data: 2,
    }) as PreEvaluated;
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

  it("should work when using both `EVENT` and `TPL`", () => {
    const preEvaluated = evaluate("<% EVENT.detail + TPL.num %>", {
      getTplVariables: () => ({
        num: 2,
      }),
    }) as PreEvaluated;

    // Simulate an event dispatching after a transformation.
    expect(
      evaluate(preEvaluated, {
        event: new CustomEvent("something.happen", {
          detail: 3,
        }),
      })
    ).toEqual(5);
  });

  it("should work when using both `DATA` and `TPL`", () => {
    const preEvaluated = evaluate("<% DATA + TPL.num %>", {
      getTplVariables: () => ({
        num: 2,
      }),
    }) as PreEvaluated;

    // Simulate an event dispatching after a transformation.
    expect(
      evaluate(preEvaluated, {
        data: 3,
      })
    ).toEqual(5);
  });

  it("should work when using all `EVENT`, `DATA` and `TPL`", () => {
    const preEvaluated = evaluate("<% EVENT.detail + DATA + TPL.num %>", {
      getTplVariables: () => ({
        num: 2,
      }),
    }) as PreEvaluated;

    // Simulate an event dispatching after a transformation.
    expect(
      evaluate(
        evaluate(preEvaluated, {
          data: 3,
        }) as PreEvaluated,
        {
          event: new CustomEvent("something.happen", {
            detail: 4,
          }),
        }
      )
    ).toEqual(9);
  });

  it("should work when using `overrideApp`", () => {
    expect(
      evaluate("<% `${APP.homepage}:${I18N('HELLO')}` %>", {
        overrideApp: {
          id: "hola",
          name: "Hola",
          homepage: "/hola",
        },
      })
    ).toEqual("/hola:Hola");
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
    ) as PreEvaluated;
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
