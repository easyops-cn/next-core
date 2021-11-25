import {
  StoryboardFunctionRegistryFactory,
  FunctionCoverageCollector,
} from "./StoryboardFunctionRegistryFactory";

jest.mock("i18next", () => ({
  getFixedT(lang: string, ns: string) {
    return (key: string) => `${ns}:${key}`;
  },
}));

describe("StoryboardFunctions", () => {
  const {
    storyboardFunctions: fn,
    registerStoryboardFunctions,
    updateStoryboardFunction,
  } = StoryboardFunctionRegistryFactory();

  it("should register two functions", () => {
    registerStoryboardFunctions(
      [
        {
          name: "sayHello",
          source: `
          function sayHello(name) {
            return FN.sayExclamation(I18N('HELLO') + ', ' + name);
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
      ],
      "my-app"
    );
    expect(fn.sayHello("world")).toBe("$app-my-app:HELLO, world!");
    expect(fn.sayExclamation("Oops")).toBe("Oops!");

    updateStoryboardFunction("sayExclamation", {
      source: `
        function sayExclamation(sentence) {
          return sentence + '!!';
        }
      `,
    });
    expect(fn.sayHello("world")).toBe("$app-my-app:HELLO, world!!");
    expect(fn.sayExclamation("Oops")).toBe("Oops!!");
  });

  it("should register a function with no appId", () => {
    registerStoryboardFunctions([
      {
        name: "i18n",
        source: `
          function i18n(...args) {
            return I18N(...args);
          }
        `,
      },
    ]);
    expect(() => {
      fn.i18n("world");
    }).toThrowErrorMatchingInlineSnapshot(`"I18N is not a function"`);
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
    ]);

    fn.test(1);
    expect(collector.beforeVisit).toBeCalledTimes(9);
    expect(collector.beforeEvaluate).toBeCalledTimes(6);
    expect(collector.beforeCall).toBeCalledTimes(1);
    expect(collector.beforeBranch).toBeCalledTimes(1);
    expect(collector.beforeBranch).toBeCalledWith(
      expect.objectContaining({
        type: "IfStatement",
      }),
      "if"
    );

    fn.test(0);
    expect(collector.beforeVisit).toBeCalledTimes(9);
    expect(collector.beforeEvaluate).toBeCalledTimes(10);
    expect(collector.beforeCall).toBeCalledTimes(2);
    expect(collector.beforeBranch).toBeCalledTimes(2);
    expect(collector.beforeBranch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "IfStatement",
      }),
      "else"
    );

    expect(fn.i18n("HELLO")).toBe("HELLO");
    expect(fn.i18nText({ zh: "你好", en: "Hello" })).toBe("Hello");
  });
});
