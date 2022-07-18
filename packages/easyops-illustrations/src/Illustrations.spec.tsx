import {
  getIllustration,
  determineIllustrationName,
  useIllustrationConfig,
  IllustrationProps,
} from "./Illustrations";
import { render } from "@testing-library/react";
import React from "react";

const setup = (
  useNewIllustration: boolean,
  illustrationsConfig: IllustrationProps
): any => {
  const returnVal = {};

  const UseIllustrationConfigTest = (): any => {
    const illustrationConfig = useIllustrationConfig(
      useNewIllustration,
      illustrationsConfig
    );

    Object.assign(returnVal, {
      ...illustrationConfig,
    });

    return null;
  };

  render(<UseIllustrationConfigTest />);

  return returnVal;
};

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

  it("useIllustrationConfig should work ", () => {
    const illustrationConfig: any = setup(true, {
      name: "no-history",
      category: "default",
      theme: "light",
    });
    expect(illustrationConfig.name).toEqual("no-history-dynamic");
    expect(illustrationConfig.category).toEqual("easyops2");
  });

  it("useIllustrationConfig should work when useNewIllustration is false", () => {
    const illustrationConfig: any = setup(false, {
      name: "no-history",
      category: "default",
      theme: "light",
    });
    expect(illustrationConfig.name).toEqual("no-history");
    expect(illustrationConfig.category).toEqual("default");
  });

  it("useIllustrationConfig should work when image with no dynamic", () => {
    const illustrationConfig: any = setup(true, {
      name: "create-content",
      category: "default",
      theme: "light",
    });
    expect(illustrationConfig.name).toEqual("create-content");
    expect(illustrationConfig.category).toEqual("easyops2");
  });

  it("useIllustrationConfig should work when category is feedback", () => {
    const illustrationConfig: any = setup(true, {
      name: "info",
      category: "feedback",
      theme: "light",
    });
    expect(illustrationConfig.name).toEqual("info");
    expect(illustrationConfig.category).toEqual("feedback");
  });
});
