import type { I18nData } from "@next-core/types";
import {
  StoryboardFunctionRegistryFactory,
  FunctionCoverageCollector,
} from "./StoryboardFunctionRegistry.js";

jest.mock("./internal/Runtime.js", () => ({
  hooks: {
    checkPermissions: {
      checkPermissions(actions: string[]) {
        return !actions.includes("my:action-b");
      },
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
}));

jest.mock("@next-core/i18n", () => ({
  i18n: {
    getFixedT(_lang: string, ns: string) {
      return (key: string) => `${ns}:${key}`;
    },
  },
  i18nText(data: I18nData) {
    return data.zh;
  },
}));

const consoleLog = jest.spyOn(console, "log").mockImplementation();

describe("StoryboardFunctions", () => {
  const {
    storyboardFunctions: fn,
    registerStoryboardFunctions,
    updateStoryboardFunction,
  } = StoryboardFunctionRegistryFactory();

  it("should register functions", () => {
    registerStoryboardFunctions(
      [
        {
          name: "sayHello",
          source: `
          function sayHello(data) {
            console.log(data);
            return FN.sayExclamation(I18N('HELLO') + ', ' + I18N_TEXT(data));
          }
        `,
          deps: ["sayExclamation"],
          perm: false,
        },
        {
          name: "sayExclamation",
          source: `
          function sayExclamation(sentence) {
            return sentence + '!';
          }
        `,
          deps: [],
          perm: false,
        },
        {
          name: "getImg",
          source: `
            function getImg() {
              return IMG.get("my-img.png");
            }
          `,
        },
        {
          name: "getBaseUrl",
          source: `
          function getBaseUrl() {
            return location.origin + BASE_URL;
          }
          `,
        },
        {
          name: "checkPermissions",
          source: `
          function checkPermissions(...actions) {
            return PERMISSIONS.check(...actions);
          }
          `,
        },
        {
          name: "getUniqueId",
          source: `
            function getUniqueId(prefix) {
              return _.uniqueId(prefix);
            }
          `,
        },
        {
          name: "nativeMode",
          source: `
            function nativeMode() {
              "native mode";
              return ["from", "normal", "mode"];
            }
          `,
          transformed: {
            globals: ["_", "document"],
            source: `
              function nativeMode() {
                "native mode";
                return document ?? _.split("from native mode", " ");
              }
            `,
          },
        },
      ],
      {
        id: "my-app",
      }
    );
    expect(fn.sayHello({ en: "world", zh: "世界" })).toBe(
      "app/my-app:HELLO, 世界!"
    );
    expect(consoleLog).toHaveBeenCalledTimes(1);
    expect(consoleLog).toHaveBeenCalledWith({ en: "world", zh: "世界" });

    expect(fn.sayExclamation("Oops")).toBe("Oops!");
    expect(fn.getImg()).toBe("/micro-apps/my-app/images/my-img.png");

    updateStoryboardFunction("sayExclamation", {
      source: `
        function sayExclamation(sentence) {
          return sentence + '!!';
        }
      `,
    });
    expect(fn.sayHello({ en: "world", zh: "世界" })).toBe(
      "app/my-app:HELLO, 世界!!"
    );
    expect(fn.sayExclamation("Oops")).toBe("Oops!!");
    expect(fn.getImg()).toBe("/micro-apps/my-app/images/my-img.png");
    expect(fn.getBaseUrl()).toBe("http://localhost");
    expect(fn.checkPermissions("my:action-a")).toBe(true);
    expect(fn.checkPermissions("my:action-b")).toBe(false);
    expect(fn.getUniqueId()).not.toBe("42");
    expect(fn.getUniqueId("test-")).not.toBe("test-42");
    expect(fn.nativeMode()).toEqual(["from", "native", "mode"]);
  });

  it("should register no functions", () => {
    registerStoryboardFunctions(undefined);
  });

  it("should throw error if function not found", () => {
    expect(() => {
      fn.notExisted();
    }).toThrowErrorMatchingInlineSnapshot(`"fn.notExisted is not a function"`);
  });

  it("should throw error if try to write functions", () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      fn.myFunc = () => 0;
    }).toThrowErrorMatchingInlineSnapshot(
      `"Cannot define property myFunc, object is not extensible"`
    );
  });
});

describe("Widget Functions", () => {
  const { storyboardFunctions: fn, registerStoryboardFunctions } =
    StoryboardFunctionRegistryFactory({
      widgetId: "my-widget",
    });

  it("should register functions", () => {
    registerStoryboardFunctions([
      {
        name: "sayHello",
        source: `
          function sayHello(data) {
            return FN.sayExclamation(I18N('HELLO') + ', ' + I18N_TEXT(data));
          }
        `,
      },
      {
        name: "sayExclamation",
        source: `
          function sayExclamation(sentence) {
            return sentence + '!';
          }
        `,
      },
      {
        name: "getImg",
        source: `
          function getImg() {
            return IMG.get("my-img.png");
          }
        `,
      },
    ]);
    expect(fn.sayHello({ en: "world", zh: "世界" })).toBe(
      "widget/my-widget:HELLO, 世界!"
    );
    expect(fn.getImg()).toBe("bricks/my-widget/dist/assets/my-img.png");
  });
});

describe("collect coverage", () => {
  it("should collect coverage", () => {
    const collector: FunctionCoverageCollector = {
      beforeVisit: jest.fn(),
      beforeEvaluate: jest.fn(),
      beforeCall: jest.fn(),
      beforeBranch: jest.fn(),
    };
    const createCollector = (): FunctionCoverageCollector => collector;
    const { storyboardFunctions: fn, registerStoryboardFunctions } =
      StoryboardFunctionRegistryFactory({
        collectCoverage: {
          createCollector,
        },
      });
    registerStoryboardFunctions([
      {
        name: "test",
        source: `
          function test(a) {
            if (a) {
              return a;
            }
            return false;
          }
        `,
      },
      {
        name: "i18n",
        source: `
          function i18n(...args) {
            return I18N(...args);
          }
        `,
      },
      {
        name: "i18nText",
        source: `
          function i18nText(...args) {
            return I18N_TEXT(...args);
          }
        `,
      },
      {
        name: "getImg",
        source: `
          function getImg() {
            return IMG.get("my-img.png");
          }
        `,
      },
      {
        name: "getBaseUrl",
        source: `
          function getBaseUrl() {
            return location.origin + BASE_URL;
          }
        `,
      },
      {
        name: "checkPermissions",
        source: `
          function checkPermissions(...actions) {
            return PERMISSIONS.check(...actions);
          }
        `,
      },
      {
        name: "getUniqueId",
        source: `
          function getUniqueId(prefix) {
            return _.uniqueId(prefix);
          }
        `,
      },
    ]);

    fn.test(1);
    expect(collector.beforeVisit).toHaveBeenCalledTimes(9);
    expect(collector.beforeEvaluate).toHaveBeenCalledTimes(6);
    expect(collector.beforeCall).toHaveBeenCalledTimes(1);
    expect(collector.beforeBranch).toHaveBeenCalledTimes(1);
    expect(collector.beforeBranch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "IfStatement",
      }),
      "if"
    );

    fn.test(0);
    expect(collector.beforeVisit).toHaveBeenCalledTimes(9);
    expect(collector.beforeEvaluate).toHaveBeenCalledTimes(10);
    expect(collector.beforeCall).toHaveBeenCalledTimes(2);
    expect(collector.beforeBranch).toHaveBeenCalledTimes(2);
    expect(collector.beforeBranch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "IfStatement",
      }),
      "else"
    );

    expect(fn.i18n("HELLO")).toBe("HELLO");
    expect(fn.i18nText({ zh: "你好", en: "Hello" })).toBe("Hello");
    expect(fn.getImg()).toBe("mock/images/my-img.png");
    expect(fn.getBaseUrl()).toBe("http://localhost:3000/next");
    expect(fn.checkPermissions("my:action-b")).toBe(true);
    expect(fn.getUniqueId()).toBe("42");
    expect(fn.getUniqueId("test-")).toBe("test-42");

    expect(typeof (fn.getUniqueId as any)[Symbol.for("$DebuggerCall$")]).toBe(
      "undefined"
    );
  });
});

describe("debugger overrides", () => {
  const { storyboardFunctions: fn, registerStoryboardFunctions } =
    StoryboardFunctionRegistryFactory({
      debuggerOverrides() {
        class DebuggerArray extends Array {}
        DebuggerArray.prototype.join = function (this: unknown[]) {
          return Array.prototype.join.call(this, "~");
        };

        return {
          LodashWithStaticFields: {
            uniqueId: (prefix?: string) => `${prefix ?? ""}!!`,
          },
          ArrayConstructor: DebuggerArray as any,
          ObjectWithStaticFields: {
            entries: (obj: Record<string, unknown>) => {
              return Object.entries(obj).concat([["extra", "entry"]]);
            },
          },
        };
      },
    });
  registerStoryboardFunctions([
    {
      name: "getUniqueId",
      source: `
          function getUniqueId() {
            return _.uniqueId("test");
          }
        `,
    },
    {
      name: "join",
      source: `
          function join() {
            const list = new Array();
            list[0] = "a";
            list[1] = "b";
            return list.join();
          }
        `,
    },
    {
      name: "joinWithArrayLiteral",
      source: `
          function joinWithArrayLiteral() {
            const list = [];
            list[0] = "a";
            list[1] = "b";
            return list.join();
          }
        `,
    },
    {
      name: "entries",
      source: `
          function entries(obj) {
            return Object.entries(obj);
          }
        `,
    },
  ]);

  it("should override lodash", () => {
    expect(typeof (fn.getUniqueId as any)[Symbol.for("$DebuggerCall$")]).toBe(
      "function"
    );
    expect(fn.getUniqueId()).toBe("test!!");
  });

  it("should override array", () => {
    expect(fn.join()).toBe("a~b");
  });

  it("should override array literal", () => {
    expect(fn.joinWithArrayLiteral()).toBe("a~b");
  });

  it("should override object", () => {
    expect(fn.entries({ a: 1, b: 2 })).toEqual([
      ["a", 1],
      ["b", 2],
      ["extra", "entry"],
    ]);
  });
});
