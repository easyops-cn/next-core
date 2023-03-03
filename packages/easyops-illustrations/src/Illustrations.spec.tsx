import {
  getIllustration,
  determineIllustrationName,
  translateIllustrationConfig,
} from "./Illustrations";

describe("Illustration", () => {
  it("should work", () => {
    const result = getIllustration({
      name: "exception",
      category: "feedback",
    });

    expect(result).toBe("assets/illustrations/svgr-url");
  });

  it("should work with default category", () => {
    const result = getIllustration({
      name: "no-content",
    });

    expect(result).toBe("assets/illustrations/svgr-url");
  });

  it("should work with default theme", () => {
    const result = getIllustration({
      name: "no-content",
    });

    expect(result).toBe("assets/illustrations/svgr-url");
  });

  it("should work with dark theme", () => {
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
    const result = getIllustration({
      name: "without",
    });

    expect(result).toBeUndefined();
  });

  it("translateIllustrationConfig should work ", () => {
    const illustrationConfig: any = translateIllustrationConfig(true, {
      name: "no-history",
      category: "default",
      theme: "light",
    });
    expect(illustrationConfig.name).toEqual("no-history-dynamic");
    expect(illustrationConfig.category).toEqual("easyops2");
  });

  it("translateIllustrationConfig should work when useNewIllustration is false", () => {
    const illustrationConfig: any = translateIllustrationConfig(false, {
      name: "no-history",
      category: "default",
      theme: "light",
    });
    expect(illustrationConfig.name).toEqual("no-history");
    expect(illustrationConfig.category).toEqual("default");
  });

  it("translateIllustrationConfig should work when image with no dynamic", () => {
    const illustrationConfig: any = translateIllustrationConfig(true, {
      name: "create-content",
      category: "default",
      theme: "light",
    });
    expect(illustrationConfig.name).toEqual("create-content");
    expect(illustrationConfig.category).toEqual("easyops2");
  });

  it("translateIllustrationConfig should work when category is feedback", () => {
    const illustrationConfig = translateIllustrationConfig(true, {
      name: "info",
      category: "feedback",
      theme: "light",
    }) as any;
    expect(illustrationConfig.name).toEqual("info");
    expect(illustrationConfig.category).toEqual("feedback");
  });
});
