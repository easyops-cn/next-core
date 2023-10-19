import { describe, test, expect } from "@jest/globals";
import { setUIClassName } from "./setUIClassName";

describe("basic usige", () => {
  beforeEach(() => {
    document.body.className = "ui-v8";
  });

  test("use 8.2 should work", async () => {
    expect(document.body.classList.value).toBe("ui-v8");

    await setUIClassName("8.2");

    expect(document.body.classList.value).toBe("ui-v8-2");
  });

  test("use 8.0 should work", async () => {
    await setUIClassName("8");

    expect(document.body.classList.value).toBe("ui-v8");
  });

  test("preClassName was null should work", async () => {
    document.body.classList.remove("ui-v8");

    expect(document.body.classList.value).toBe("");

    await setUIClassName("8.2");

    expect(document.body.classList.value).toBe("ui-v8-2");
  });
});
