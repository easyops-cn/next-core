import { getGeneralGlobals } from "./getGeneralGlobals";
import i18next from "i18next";

describe("getGeneralGlobals", () => {
  beforeEach(() => {
    document.documentElement.style.setProperty("--brand-color", "red");
  });
  it("should get current theme", () => {
    const attemptToVisitGlobals = new Set(["THEME"]);

    expect(
      (
        getGeneralGlobals(attemptToVisitGlobals, { collectCoverage: true })
          .THEME as any
      ).getTheme()
    ).toEqual("light");

    expect(
      (
        getGeneralGlobals(attemptToVisitGlobals, { collectCoverage: false })
          .THEME as any
      ).getTheme()
    ).toEqual("light");
  });

  it("should get css-variable value", () => {
    const attemptToVisitGlobals = new Set(["THEME"]);
    expect(
      (
        getGeneralGlobals(attemptToVisitGlobals, { collectCoverage: true })
          .THEME as any
      ).getCssPropertyValue("--brand-color")
    ).toEqual("");
    expect(
      (
        getGeneralGlobals(attemptToVisitGlobals, { collectCoverage: false })
          .THEME as any
      ).getCssPropertyValue("--brand-color")
    ).toEqual("red");
  });

  describe("ERROR_CODE_TEXT", () => {
    const realLanguage = i18next.language;
    const attemptToVisitGlobals = new Set(["ERROR_CODE_TEXT"]);

    afterEach(() => {
      Object.defineProperty(i18next, "language", {
        value: realLanguage,
        configurable: true,
      });
    });

    it("should return a coverage-safe function when collecting coverage", () => {
      const fn = getGeneralGlobals(attemptToVisitGlobals, {
        collectCoverage: true,
      }).ERROR_CODE_TEXT as (json: unknown) => string | undefined;
      // 覆盖率模式下函数存在但恒返回 undefined（表达式 `||` 落回原有字段）
      expect(fn).toBeInstanceOf(Function);
      expect(fn({ code: 133115 })).toBeUndefined();
    });

    it("should return undefined in non-English locale", () => {
      Object.defineProperty(i18next, "language", {
        value: "zh",
        configurable: true,
      });
      const fn = getGeneralGlobals(attemptToVisitGlobals, {
        collectCoverage: false,
      }).ERROR_CODE_TEXT as (json: unknown) => string | undefined;
      expect(fn({ code: 133115 })).toBeUndefined();
      // storyboard 表达式 `||` 语义：undefined 落回原有字段（中文态行为不变）
    });

    it("should return dictionary identifier in English locale", () => {
      Object.defineProperty(i18next, "language", {
        value: "en",
        configurable: true,
      });
      const fn = getGeneralGlobals(attemptToVisitGlobals, {
        collectCoverage: false,
      }).ERROR_CODE_TEXT as (json: unknown) => string | undefined;
      expect(fn({ code: 133115 })).toBe("The object attribute already exists.");
      expect(fn({ code: 999999 })).toBe("Unknown error.");
      expect(fn({})).toBe("Unknown error.");
      expect(fn(undefined)).toBe("Unknown error.");
    });
  });
});
