import { visitStoryboardExpressions, visitStoryboardFunctions } from ".";

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
