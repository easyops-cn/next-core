import { describe, test, expect } from "@jest/globals";
import { isStrictMode, warnAboutStrictMode } from "./isStrictMode.js";

const consoleWarn = jest.spyOn(console, "warn").mockReturnValue();
const consoleError = jest.spyOn(console, "error").mockReturnValue();

describe("isStrictMode", () => {
  test("default", () => {
    expect(isStrictMode()).toBe(false);
  });

  test("feature flag is set", () => {
    expect(
      isStrictMode({ flags: { "brick-next-v3-strict-mode": true } } as any)
    ).toBe(true);
  });

  test("feature flag is not set", () => {
    expect(isStrictMode({ flags: {} } as any)).toBe(false);
  });
});

describe("warnAboutStrictMode", () => {
  test("strict mode", () => {
    warnAboutStrictMode(true, "`useBrick.transform`");
    expect(consoleError).toHaveBeenCalledWith(
      "`useBrick.transform` is dropped in v3 strict mode"
    );
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  test("non-strict mode", () => {
    warnAboutStrictMode(false, "`useBrick.transform`");
    expect(consoleWarn).toHaveBeenCalledWith(
      "`useBrick.transform` is deprecated in v3 and will be dropped in strict mode"
    );
    expect(consoleError).not.toHaveBeenCalled();
  });

  test("strict mode with extra logs", () => {
    warnAboutStrictMode(true, "`useBrick.transform`", "extra", "logs");
    expect(consoleError).toHaveBeenCalledWith(
      "`useBrick.transform` is dropped in v3 strict mode,",
      "extra",
      "logs"
    );
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  test("non-strict mode with extra logs", () => {
    warnAboutStrictMode(false, "`useBrick.transform`", "extra", "logs");
    expect(consoleWarn).toHaveBeenCalledWith(
      "`useBrick.transform` is deprecated in v3 and will be dropped in strict mode,",
      "extra",
      "logs"
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
