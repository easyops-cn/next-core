import { describe, test, expect } from "@jest/globals";
import { i18n } from "@next-core/i18n";
import { createProviderClass } from "@next-core/utils/storyboard";
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
import { checkPermissions } from "../checkPermissions.js";
import { hasInstalledApp } from "../checkInstalledApps.js";
import { registerWidgetFunctions } from "./WidgetFunctions.js";
import { getRuntime } from "../Runtime.js";
import { getMenuById } from "../menu/fetchMenuById.js";
import { registerStoryboardFunctions } from "./StoryboardFunctions.js";

jest.mock("@next-core/loader", () => ({
  loadBricksImperatively() {
    return Promise.resolve();
  },
  loadProcessorsImperatively() {
    return Promise.resolve();
  },
}));
jest.mock("./getStorageItem.js");
jest.mock("../checkPermissions.js");
jest.mock("../checkInstalledApps.js");
jest.mock("../Runtime.js");
jest.mock("../menu/fetchMenuById.js");

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

(getRuntime as jest.Mock).mockImplementation(() => ({
  getMiscSettings() {
    return {
      hello: "world",
    };
  },
  getFeatureFlags() {
    return {};
  },
}));

function objectEntries(object: object) {
  return Object.entries(object);
}
customProcessors.define("brickKit.objectEntries", objectEntries);

(
  getStorageItem as jest.MockedFunction<typeof getStorageItem>
).mockImplementation(() => {
  return () => ({ id: "mockId" });
});

(
  checkPermissions as jest.MockedFunction<typeof checkPermissions>
).mockImplementation((...actions) => {
  return !actions.includes("my:action-b");
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

(getMenuById as jest.Mock).mockImplementation((menuId: string) => ({
  title: `Mocked Menu: ${menuId}`,
}));

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
const runtimeContext: RuntimeContext = {
  pendingPermissionsPreCheck: [Promise.resolve()],
  ctxStore,
  tplStateStoreId,
  tplStateStoreMap,
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
  },
  data: {
    cellData: "dynamic data",
  },
  event: new CustomEvent("how", { detail: "yes" }),
  forEachItem: 1,
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
    ["<% FLAGS.test %>", true],
    ["<% HASH %>", "#readme"],
    ["<% PATH_NAME %>", "/path/name"],
    ["<% ANCHOR %>", "readme"],
    // ["<% SEGUE.getUrl('testSegueId') %>", "/segue-target"],
    // ["<% ALIAS.getUrl('mock-alias') %>", "/mock/alias"],
    ["<% IMG.get('a.jpg') %>", "micro-apps/hello/images/a.jpg"],
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
    ["<% STATE.myState %>", "better"],
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
    const { forEachItem, ...rest } = runtimeContext;
    expect(() =>
      evaluate("<% ITEM %>", rest)
    ).toThrowErrorMatchingInlineSnapshot(
      `"ITEM is not defined, in "<% ITEM %>""`
    );
    expect(consoleError).toBeCalledTimes(1);
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
