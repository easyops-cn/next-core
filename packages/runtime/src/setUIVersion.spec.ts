import { describe, test, expect } from "@jest/globals";
import { setUIVersion } from "./setUIVersion.js";

describe("basic usage", () => {
  beforeEach(() => {
    delete document.documentElement.dataset.ui;
  });

  test("use 8.2 should work", async () => {
    expect(document.documentElement.dataset.ui).toBe(undefined);

    await setUIVersion("8.2");

    expect(document.documentElement.dataset.ui).toBe("v8-2");
  });

  test("use 8.0 should work", async () => {
    await setUIVersion("8");

    expect(document.documentElement.dataset.ui).toBe("v8");
  });
});
