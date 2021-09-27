import { StoryboardFunctionRegistryFactory } from "./StoryboardFunctionRegistryFactory";

describe("StoryboardFunctions", () => {
  const {
    storyboardFunctions,
    registerStoryboardFunctions,
    updateStoryboardFunction,
  } = StoryboardFunctionRegistryFactory();

  it("should register two functions", () => {
    registerStoryboardFunctions([
      {
        name: "sayHello",
        source: `
          function sayHello(name) {
            return FN.sayExclamation('Hello, ' + name);
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
    ]);
    const fn = storyboardFunctions;
    expect(fn.sayHello("world")).toBe("Hello, world!");
    expect(fn.sayExclamation("Oops")).toBe("Oops!");

    updateStoryboardFunction("sayExclamation", {
      source: `
        function sayExclamation(sentence) {
          return sentence + '!!';
        }
      `,
    });
    expect(fn.sayHello("world")).toBe("Hello, world!!");
    expect(fn.sayExclamation("Oops")).toBe("Oops!!");
  });

  it("should register no functions", () => {
    registerStoryboardFunctions(undefined);
  });

  it("should throw error if function not found", () => {
    expect(() => {
      storyboardFunctions.notExisted();
    }).toThrowErrorMatchingInlineSnapshot(
      `"storyboardFunctions.notExisted is not a function"`
    );
  });

  it("should throw error if try to write functions", () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      storyboardFunctions.myFunc = () => 0;
    }).toThrowErrorMatchingInlineSnapshot(
      `"Cannot define property myFunc, object is not extensible"`
    );
  });
});
