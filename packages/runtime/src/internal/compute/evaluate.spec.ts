import { describe, test, expect } from "@jest/globals";
import { i18n } from "@next-core/i18n";
import { createProviderClass } from "@next-core/utils/general";
import type { RuntimeContext } from "../interfaces.js";
import {
  asyncEvaluate,
  evaluate,
  getPreEvaluatedRaw,
  shouldDismissMarkingComputed,
} from "./evaluate.js";
import { DataStore } from "../data/DataStore.js";
import { registerWidgetI18n } from "./WidgetI18n.js";
import { getI18nNamespace } from "../registerAppI18n.js";
import { customProcessors } from "../../CustomProcessors.js";
import { getStorageItem } from "./getStorageItem.js";
import { hasInstalledApp } from "../hasInstalledApp.js";
import { registerWidgetFunctions } from "./WidgetFunctions.js";
import { registerStoryboardFunctions } from "./StoryboardFunctions.js";
import { getDevHook } from "../devtools.js";
import { _internalApiGetRuntimeContext } from "../Runtime.js";

jest.mock("@next-core/loader", () => ({
  loadBricksImperatively() {
    return Promise.resolve();
  },
  loadProcessorsImperatively() {
    return Promise.resolve();
  },
}));
jest.mock("./getStorageItem.js");
jest.mock("../hasInstalledApp.js");
jest.mock("../Runtime.js", () => ({
  getRuntime() {
    return {
      getMiscSettings() {
        return {
          hello: "world",
        };
      },
      getFeatureFlags() {
        return {};
      },
    };
  },
  hooks: {
    checkPermissions: {
      checkPermissions(actions: string[]) {
        return !actions.includes("my:action-b");
      },
    },
    menu: {
      getMenuById(menuId: string) {
        return {
          title: `Mocked Menu: ${menuId}`,
        };
      },
      fetchMenuById: jest.fn(),
    },
    images: {
      imagesFactory(appId: string) {
        return {
          get(name: string) {
            return `/micro-apps/${appId}/images/${name}`;
          },
        };
      },
      widgetImagesFactory(widgetId: string) {
        return {
          get(name: string) {
            return `bricks/${widgetId}/dist/assets/${name}`;
          },
        };
      },
    },
  },
  getBrickPackages() {
    return [];
  },
  _internalApiGetRuntimeContext: jest.fn(),
}));
jest.mock("../devtools.js");

i18n.init({
  fallbackLng: "en",
});
i18n.addResourceBundle("en", getI18nNamespace("app", "hello"), {
  HELLO: "Hello",
  COUNT_ITEMS: "Total {{count}} items",
});
i18n.addResourceBundle("en", getI18nNamespace("app", "hola"), {
  HELLO: "Hola",
});
i18n.addResourceBundle("en", getI18nNamespace("menu", "hello"), {
  HELLO: "Hi",
});

registerWidgetI18n("my-widget", {
  en: {
    WORLD: "World",
  },
  zh: {
    WORLD: "世界",
  },
});

registerWidgetFunctions("widget-a", [
  {
    name: "abc",
    source: `function abc() {
    return "Hello, xyz";
  }`,
  },
]);

function objectEntries(object: object) {
  return Object.entries(object);
}
customProcessors.define("brickKit.objectEntries", objectEntries);

(
  getStorageItem as jest.MockedFunction<typeof getStorageItem>
).mockImplementation(() => {
  return () => ({ id: "mockId" });
});

const mockInstalledApps = ["my-app-id"];
(
  hasInstalledApp as jest.MockedFunction<typeof hasInstalledApp>
).mockImplementation((appId, matchVersion) => {
  return (
    mockInstalledApps.includes(appId) &&
    !(matchVersion && matchVersion.startsWith(">"))
  );
});

customElements.define(
  "my-test-provider",
  createProviderClass((input: string) => Promise.resolve(`resolved:${input}`))
);

registerStoryboardFunctions([
  {
    name: "sayHello",
    source: `function sayHello() {
      return "hello";
    }`,
  },
  {
    name: "saySecret",
    source: `function sayHello() {
      return PERMISSIONS.check("my:action-a") ? "yes": "no";
    }`,
  },
]);

const ctxStore = new DataStore("CTX");

const tplStateStoreMap = new Map<string, DataStore<"STATE">>();
const stateStore = new DataStore("STATE", null!);
const tplStateStoreId = "tpl-state-0";
tplStateStoreMap.set(tplStateStoreId, stateStore);

const formStateStoreMap = new Map<string, DataStore<"FORM_STATE">>();
const formStateStore = new DataStore("FORM_STATE", null!);
const formStateStoreId = "form-state-0";
formStateStoreMap.set(formStateStoreId, formStateStore);

const runtimeContext: RuntimeContext = {
  pendingPermissionsPreCheck: [Promise.resolve()],
  ctxStore,
  tplStateStoreId,
  tplStateStoreMap,
  formStateStoreId,
  formStateStoreMap,
  app: {
    id: "hello",
    name: "Hello",
    homepage: "/hello",
  },
  location: {
    pathname: "/path/name",
    search: "?a=x&b=2&b=1",
    hash: "#readme",
    state: null,
  },
  query: new URLSearchParams("a=x&b=2&b=1"),
  match: {
    params: {
      objectId: "HOST",
    },
  } as any,
  flags: {
    test: true,
  },
  sys: {
    username: "tester",
    settings: {
      brand: {
        theme: "light",
      },
    },
  },
  data: {
    cellData: "dynamic data",
  },
  event: new CustomEvent("how", { detail: "yes" }),
  forEachItem: 1,
  forEachIndex: 0,
  forEachSize: 2,
};

ctxStore.define(
  [
    {
      name: "myFreeContext",
      value: "good",
    },
    {
      name: "myLazyContext",
      resolve: {
        useProvider: "my-test-provider",
        args: ["ctx"],
      },
    },
  ],
  runtimeContext
);
stateStore.define(
  [
    {
      name: "myState",
      value: "better",
    },
    {
      name: "myLazyState",
      resolve: {
        useProvider: "my-test-provider",
        args: ["state"],
      },
    },
  ],
  runtimeContext
);
formStateStore.define(
  [
    {
      name: "myFormItem",
      value: "input",
    },
  ],
  runtimeContext
);

const consoleError = jest.spyOn(console, "error");

describe("evaluate", () => {
  test.each<[string, unknown]>([
    ["<% [] %>", []],
    ["<% EVENT.detail %>", "yes"],
    ["<% DATA.cellData %>", "dynamic data"],
    ["<% APP.homepage %>", "/hello"],
    ["<% APP.getMenu('test') %>", { title: "Mocked Menu: test" }],
    ["<% PATH.objectId %>", "HOST"],
    [" <% QUERY.a %>", "x"],
    ["<% QUERY.b %> ", "2"],
    ["<% QUERY.x %> ", undefined],
    ["<% _.isEmpty(QUERY) %> ", false],
    [" <% QUERY_ARRAY.b %> ", ["2", "1"]],
    ["<% QUERY_ARRAY.x %> ", undefined],
    ["<% _.isEmpty(QUERY_ARRAY) %> ", false],
    ["\n\t<% PARAMS.get('b') %>\n\t", "2"],
    ["<% PARAMS.getAll('b') %>", ["2", "1"]],
    ["<% PARAMS.toString() %>", "a=x&b=2&b=1"],
    ["<% SYS.username %>", "tester"],
    ["<% SYS.settings.brand.theme %>", "light"],
    ["<% FLAGS.test %>", true],
    ["<% HASH %>", "#readme"],
    ["<% PATH_NAME %>", "/path/name"],
    ["<% ANCHOR %>", "readme"],
    // ["<% SEGUE.getUrl('testSegueId') %>", "/segue-target"],
    // ["<% ALIAS.getUrl('mock-alias') %>", "/mock/alias"],
    ["<% IMG.get('a.jpg') %>", "/micro-apps/hello/images/a.jpg"],
    [
      "<% __WIDGET_IMG__('my-widget').get('b.png') %>",
      "bricks/my-widget/dist/assets/b.png",
    ],
    ["<% I18N('HELLO') %>", "Hello"],
    ["<% I18N('COUNT_ITEMS', { count: 5 }) %>", "Total 5 items"],
    ["<% I18N('NOT_EXISTED') %>", "NOT_EXISTED"],
    ["<% __WIDGET_I18N__('my-widget')('WORLD') %>", "World"],
    ["<% I18N_TEXT({ en: 'hello', zh: '你好' }) %>", "你好"],
    ["<% CTX.myFreeContext %>", "good"],
    ["<% CTX.notExisted %>", undefined],
    [
      "<% PROCESSORS.brickKit.objectEntries({quality: 'good'}) %>",
      [["quality", "good"]],
    ],
    ["<% PERMISSIONS.check('my:action-a') %>", true],
    ["<% PERMISSIONS.check('my:action-b') %>", false],
    ["<% LOCAL_STORAGE.getItem('visit-history') %>", { id: "mockId" }],
    ["<% THEME.getTheme() %>", "light"],
    ["<% SESSION_STORAGE.getItem('visit-history') %>", { id: "mockId" }],
    ["<% INSTALLED_APPS.has('my-app-id') %>", true],
    ["<% INSTALLED_APPS.has('my-app-id', '<1.2.3') %>", true],
    ["<% INSTALLED_APPS.has('my-app-id', '>=1.2.3') %>", false],
    ["<% INSTALLED_APPS.has('my-another-app-id') %>", false],
    ["<% FN.sayHello() %>", "hello"],
    ["<% MEDIA %>", { breakpoint: "xLarge" }],
    ['<% __WIDGET_FN__["widget-a"].abc() %>', "Hello, xyz"],
    ["<% MISC.hello %>", "world"],
    ["<% BASE_URL %>", ""],
    ["<% ITEM %>", 1],
    ["<% INDEX %>", 0],
    ["<% SIZE %>", 2],
    ["<% STATE.myState %>", "better"],
    ["<% FORM_STATE.myFormItem %>", "input"],
  ])("evaluate(%j) should return %j", (raw, result) => {
    expect(evaluate(raw, runtimeContext)).toEqual(result);
  });

  test("some boundary cases", () => {
    const result = evaluate("<% [PATH.objectId, SYS.username, ANCHOR] %>", {
      location: { hash: "" },
    } as RuntimeContext);
    expect(result).toEqual([undefined, undefined, null]);
  });

  test("call undefined processors", () => {
    expect(() =>
      evaluate("<% PROCESSORS.foo.bar() %>", runtimeContext)
    ).toThrowErrorMatchingInlineSnapshot(
      `"'PROCESSORS.foo' is not registered! Have you installed the relevant brick package?, in "<% PROCESSORS.foo.bar() %>""`
    );
  });

  test("Non-static usage of APP.getMenu", () => {
    expect(() =>
      evaluate("<% APP.getMenu(HASH) %>", runtimeContext)
    ).toThrowErrorMatchingInlineSnapshot(
      `"Non-static usage of "APP.getMenu" is prohibited in v3, check your expression: "<% APP.getMenu(HASH) %>""`
    );
  });

  test("Non-static usage of INSTALLED_APPS.has", () => {
    expect(() =>
      evaluate("<% INSTALLED_APPS.has(HASH) %>", runtimeContext)
    ).toThrowErrorMatchingInlineSnapshot(
      `"Non-static usage of "INSTALLED_APPS.has" is prohibited in v3, check your expression: "<% INSTALLED_APPS.has(HASH) %>""`
    );
  });

  test("Use ITEM without in :forEach", () => {
    consoleError.mockImplementationOnce(() => void 0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { forEachItem, ...rest } = runtimeContext;
    expect(() =>
      evaluate("<% ITEM %>", rest)
    ).toThrowErrorMatchingInlineSnapshot(
      `"ITEM is not defined, in "<% ITEM %>""`
    );
    expect(consoleError).toBeCalledTimes(1);
  });

  test("Access QUERY but no query in context", () => {
    const { query: _query, ...rest } = runtimeContext;
    expect(() =>
      evaluate("<% QUERY.q %>", rest as RuntimeContext)
    ).toThrowErrorMatchingInlineSnapshot(
      `"QUERY is not defined, in "<% QUERY.q %>""`
    );
  });

  test("Access QUERY_ARRAY but no query in context", () => {
    const { query: _query, ...rest } = runtimeContext;
    expect(() =>
      evaluate("<% QUERY_ARRAY.q %>", rest as RuntimeContext)
    ).toThrowErrorMatchingInlineSnapshot(
      `"QUERY_ARRAY is not defined, in "<% QUERY_ARRAY.q %>""`
    );
  });

  test("Access PARAMS but no query in context", () => {
    const { query: _query, ...rest } = runtimeContext;
    expect(() =>
      evaluate("<% PARAMS.q %>", rest as RuntimeContext)
    ).toThrowErrorMatchingInlineSnapshot(
      `"PARAMS is not defined, in "<% PARAMS.q %>""`
    );
  });

  test("Access APP but no app in context", () => {
    const { app: _app, ...rest } = runtimeContext;
    expect(() =>
      evaluate("<% APP.homepage %>", rest as RuntimeContext)
    ).toThrowErrorMatchingInlineSnapshot(
      `"APP is not defined, in "<% APP.homepage %>""`
    );
  });

  test("Access non-existed global CTX.DS", () => {
    expect(() =>
      evaluate("<% CTX.DS.demo %>", runtimeContext)
    ).toThrowErrorMatchingInlineSnapshot(
      `"Cannot read properties of undefined (reading 'demo'), in "<% CTX.DS.demo %>""`
    );
  });

  test("Access existed global CTX.DS", () => {
    (_internalApiGetRuntimeContext as jest.Mock).mockReturnValueOnce({
      ctxStore: {
        has(key: string) {
          return key === "DS";
        },
        getValue(key: string) {
          return key === "DS" ? { demo: "mocked-DS" } : undefined;
        },
      },
    });
    expect(evaluate("<% CTX.DS.demo %>", runtimeContext)).toBe("mocked-DS");
  });
});

describe("asyncEvaluate", () => {
  test.each<[string, unknown]>([
    ["<% BASE_URL %>", ""],
    ["<% CTX.myLazyContext %>", "resolved:ctx"],
    ["<% STATE.myLazyState %>", "resolved:state"],
    [
      "<% PROCESSORS.brickKit.objectEntries({quality: 'good'}) %>",
      [["quality", "good"]],
    ],
    ["<% PERMISSIONS.check('my:action-a') %>", true],
    ["<% PERMISSIONS.check('my:action-b') %>", false],
    ["<% FN.sayHello() %>", "hello"],
    ["<% FN.saySecret() %>", "yes"],
    ["<% APP.getMenu('test') %>", { title: "Mocked Menu: test" }],
    ["<% INSTALLED_APPS.has('my-app-id') %>", true],
  ])("asyncEvaluate(%j) should be resolved as %j", async (raw, result) => {
    expect(await asyncEvaluate(raw, runtimeContext)).toEqual(result);
  });
});

describe("asyncEvaluate with devtools", () => {
  beforeAll(() => {
    (getDevHook as jest.Mock).mockReturnValue({});
  });

  afterAll(() => {
    (getDevHook as jest.Mock).mockReturnValue(undefined);
  });

  test.each<[string, unknown]>([
    [
      "<% PROCESSORS.brickKit.objectEntries({quality: 'good'}) %>",
      [["quality", "good"]],
    ],
    ["<% CTX.myFreeContext %>", "good"],
    ["<% STATE.myState %>", "better"],
    ["<% FORM_STATE.myFormItem %>", "input"],
  ])(
    "asyncEvaluate(%j) with devtools should be resolved as %j",
    async (raw, result) => {
      expect(await asyncEvaluate(raw, runtimeContext)).toEqual(result);
    }
  );
});

describe("getPreEvaluatedRaw", () => {
  test("basic", () => {
    expect(
      getPreEvaluatedRaw({
        [Symbol.for("pre.evaluated.raw")]: "<% x %>",
      } as any)
    ).toBe("<% x %>");
  });
});

describe("shouldDismissMarkingComputed", () => {
  test.each<[any, boolean]>([
    ["<% x %>", false],
    ["<% x %>", false],
    [{ [Symbol.for("pre.evaluated.raw")]: "<% x %>" }, false],
    [{ [Symbol.for("pre.evaluated.raw")]: "<%~ x %>" }, true],
  ])("shouldDismissMarkingComputed(%j) should return %j", (raw, result) => {
    expect(shouldDismissMarkingComputed(raw)).toBe(result);
  });
});
