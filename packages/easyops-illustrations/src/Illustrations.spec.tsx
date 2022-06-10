import { getIllustration, determineIllustrationName } from "./Illustrations";

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

  it("should work with default theme", () => {
    window.CORE_ROOT = "-/core/";
    const result = getIllustration({
      name: "no-content",
    });

    expect(result).toBe("-/core/assets/illustrations/mockFile");
  });

  it("should work with dark theme", () => {
    window.CORE_ROOT = "-/core/";
    let result = determineIllustrationName("default", "dark-v2", "no-content");
    expect(result).toBe("no-content-dark");
    result = determineIllustrationName("exception", "dark-v2", "no-content");
    expect(result).toBe("no-content-dark");
    result = determineIllustrationName("feedback", "dark-v2", "no-content");
    expect(result).toBe("no-content-dark");
    result = determineIllustrationName("easyops2", "dark-v2", "no-content");
    expect(result).toBe("no-content-dark");
    const result_not_dark = determineIllustrationName(
      "not-easyops",
      "dark-v2",
      "some-illustrations"
    );
    expect(result_not_dark).toBe("some-illustrations");
  });

  it("should return undefined when illustration not exist", () => {
    window.CORE_ROOT = undefined;
    const result = getIllustration({
      name: "without",
    });

    expect(result).toBeUndefined();
  });
});
