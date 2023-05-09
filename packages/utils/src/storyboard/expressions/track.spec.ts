import { describe, test, expect, jest } from "@jest/globals";
import { track, trackAll } from "./track.js";

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

describe("trackAll", () => {
  test("basic usage", () => {
    const result1 = trackAll(
      '<%= CTX.abc + CTX["xyz"] + CTX[DATA.non] + STATE.a + STATE["b"] + FORM_STATE.c %>'
    );
    expect(result1).toEqual({
      context: ["abc", "xyz"],
      formState: ["c"],
      state: ["a", "b"],
    });

    const result2 = trackAll("<%= CTX.abc %>");
    expect(result2).toEqual({
      context: ["abc"],
      formState: false,
      state: false,
    });
  });

  test("no usage", () => {
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {
      // Do nothing
    });
    const result = trackAll("<%= DATA.CTX.abc %>");
    expect(result).toBe(false);
    expect(consoleWarn).toBeCalledWith(
      expect.stringContaining(`no "CTX" or "STATE" or "FORM_STATE" usage found`)
    );
  });

  test("no track", () => {
    const result = trackAll("<%= abc %>");
    expect(result).toBe(false);
  });
});
