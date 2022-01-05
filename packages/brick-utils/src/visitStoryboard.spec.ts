import {
  visitStoryboardExpressions,
  visitStoryboardFunctions,
} from "./visitStoryboard";

const consoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => void 0);

afterEach(() => {
  jest.clearAllMocks();
});

describe("visitStoryboardFunctions", () => {
  it("should throw error", () => {
    visitStoryboardFunctions(
      [
        {
          name: "test",
          source: "function test() { const }",
        },
      ],
      jest.fn()
    );
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith(
      expect.stringContaining('Parse storyboard function "test" failed'),
      expect.anything()
    );
  });
});

describe("visitStoryboardExpressions", () => {
  it("should visit things other than expressions", () => {
    const visitNonExpressionString = jest.fn();
    const visitObject = jest.fn();
    visitStoryboardExpressions(
      {
        any: ["<% CTX.a %>", "<% FN.b %>", "hello", "<% QUERY.c %>"],
      },
      jest.fn(),
      {
        matchExpressionString(v) {
          return v.includes("CTX") || v.includes("FN");
        },
        visitNonExpressionString,
        visitObject,
      }
    );
    expect(visitNonExpressionString).toBeCalledTimes(2);
    expect(visitNonExpressionString).toHaveBeenNthCalledWith(1, "hello");
    expect(visitNonExpressionString).toHaveBeenNthCalledWith(
      2,
      "<% QUERY.c %>"
    );
    expect(visitObject).toBeCalledTimes(2);
    expect(visitObject).toHaveBeenNthCalledWith(1, { any: expect.any(Array) });
    expect(visitObject).toHaveBeenNthCalledWith(2, expect.any(Array));
  });

  it("should throw error", () => {
    visitStoryboardExpressions(
      {
        any: "<% CTX. %>",
      },
      jest.fn(),
      "CTX"
    );
    expect(consoleError).toBeCalledTimes(1);
    expect(consoleError).toBeCalledWith(
      expect.stringContaining("Parse storyboard expression failed"),
      expect.anything()
    );
  });
});
