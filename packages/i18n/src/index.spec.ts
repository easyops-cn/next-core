import { describe, test, expect } from "@jest/globals";
import { i18n } from "@next-core/i18n";
import { initializeI18n } from "./index.js";

describe("index", () => {
  test("general", () => {
    initializeI18n();
    expect(i18n.language).toBe("en-US");
  });
});
