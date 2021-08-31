import {
  getStoryboardFunctions,
  registerStoryboardFunctions,
} from "./StoryboardFunctions";

describe("StoryboardFunctions", () => {
  it("should register two functions", () => {
    registerStoryboardFunctions({
      app: null,
      meta: {
        functions: [
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
        ],
      },
    });
    const fn = getStoryboardFunctions();
    expect(fn.sayHello("world")).toBe("Hello, world!");
    expect(fn.sayExclamation("Oops")).toBe("Oops!");
  });

  it("should register no functions", () => {
    registerStoryboardFunctions({
      app: null,
    });
  });

  it("should throw error if function not found", () => {
    expect(() => {
      getStoryboardFunctions().notExisted;
    }).toThrowErrorMatchingInlineSnapshot(`"Function not found: notExisted"`);
  });

  it("should throw error if try to write functions", () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      getStoryboardFunctions().myFunc = () => 0;
    }).toThrowErrorMatchingInlineSnapshot(
      `"Cannot define property myFunc, object is not extensible"`
    );
  });
});
