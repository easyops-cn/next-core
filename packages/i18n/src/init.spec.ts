import { describe, test, expect } from "@jest/globals";
import { i18n } from "@next-core/i18n";
import { initializeI18n } from "./init.js";

describe("initializeI18n", () => {
  test("general", () => {
    initializeI18n();
    expect(i18n.language).toBe("en-US");
  });

  test("with initial locales", () => {
    initializeI18n("TEST", {
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
