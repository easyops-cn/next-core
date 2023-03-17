import { getGeneralGlobals } from "./getGeneralGlobals.js";

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

  // Todo: resume test
  it.skip("should get css-variable value", () => {
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
});
