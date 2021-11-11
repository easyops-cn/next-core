import { getIllustration } from "./Illustrations";

describe("Illustration", () => {
  it("should work", () => {
    window.CORE_ROOT = undefined;
    const result = getIllustration({
      name: "exception",
      category: "feedback",
    });

    expect(result).toBe("assets/illustrations/mockFile");
  });

  it("should work with default category", () => {
    window.CORE_ROOT = "-/core/";
    const result = getIllustration({
      name: "no-content",
    });

    expect(result).toBe("-/core/assets/illustrations/mockFile");
  });

  it("should return undefined when illustration not exist", () => {
    window.CORE_ROOT = undefined;
    const result = getIllustration({
      name: "without",
    });

    expect(result).toBeUndefined();
  });
});
