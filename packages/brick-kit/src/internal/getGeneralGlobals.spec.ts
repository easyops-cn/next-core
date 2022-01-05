import { getGeneralGlobals } from "./getGeneralGlobals";

describe("getGeneralGlobals", () => {
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
});
