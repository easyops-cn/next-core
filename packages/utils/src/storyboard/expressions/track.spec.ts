import { describe, test, expect, jest } from "@jest/globals";
import { track } from "./track.js";

describe("track", () => {
  test("basic usage", () => {
    const result = track(
      '<% "track context", CTX.abc + CTX["xyz"] + CTX[DATA.non] %>',
      "track context",
      "CTX"
    );
    expect([...(result as Set<string>)]).toEqual(["abc", "xyz"]);
  });

  test("no usage", () => {
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {
      // Do nothing
    });
    const result = track(
      '<% "track context", DATA.CTX.abc %>',
      "track context",
      "CTX"
    );
    expect(result).toBe(false);
    expect(consoleWarn).toBeCalledWith(
      expect.stringContaining(`no \`CTX\` usage found`)
    );
  });

  test("no track", () => {
    const result = track("<% CTX.abc %>", "track context", "CTX");
    expect(result).toBe(false);
  });
});
