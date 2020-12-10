import { getIllustration } from "./Illustrations";

describe("Illustration", () => {
  it("should work", () => {
    const result = getIllustration({
      name: "exception",
      category: "feedback",
    });

    expect(result).toBe("mockFile");
  });

  it("should work with default category", () => {
    const result = getIllustration({
      name: "no-content",
    });

    expect(result).toBe("mockFile");
  });

  it("should return undefined when illustration not exist", () => {
    const result = getIllustration({
      name: "without",
    });

    expect(result).toBeUndefined();
  });
});
