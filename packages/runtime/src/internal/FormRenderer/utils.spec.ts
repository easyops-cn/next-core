import { describe, test, expect } from "@jest/globals";
import { getFormStateStore } from "./utils.js";
import { DataStore } from "../data/DataStore.js";

const formStateStoreMap = new Map([
  ["form-state-1", new DataStore("FORM_STATE")],
]);

describe("getFormStateStore", () => {
  test("use outside of form renderer", () => {
    expect(() => {
      getFormStateStore(
        {
          formStateStoreId: undefined,
          formStateStoreMap,
        },
        "FORM_STATE.x"
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Using "FORM_STATE.x" outside of form renderer"`
    );
  });

  test("state store not found", () => {
    expect(() => {
      getFormStateStore(
        {
          formStateStoreId: "form-state-0",
          formStateStoreMap,
        },
        "FORM_STATE.x"
      );
    }).toThrowErrorMatchingInlineSnapshot(`
      "Form state store is not found when using "FORM_STATE.x".
      This is a bug of Brick Next, please report it."
    `);
  });
});
