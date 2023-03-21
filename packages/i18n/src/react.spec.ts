import { describe, test, expect } from "@jest/globals";
import { i18n } from "@next-core/i18n";
import { initializeReactI18n } from "./react.js";

describe("initializeReactI18n", () => {
  test("general", () => {
    initializeReactI18n();
    expect(i18n.language).toBe("en-US");
  });

  test("with initial locales", () => {
    initializeReactI18n("TEST", {
      zh: {
        HELLO: "你好",
      },
      en: {
        HELLO: "Hello",
      },
    });
    expect(i18n.t("TEST:HELLO")).toBe("Hello");
  });
});
