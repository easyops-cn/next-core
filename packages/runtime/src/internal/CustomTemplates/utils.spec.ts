import { describe, test, expect } from "@jest/globals";
import {
  getTagNameOfCustomTemplate,
  getTplHostElement,
  getTplStateStore,
} from "./utils.js";
import { DataStore } from "../data/DataStore.js";
import { customTemplates } from "../../CustomTemplates.js";

const tplStateStoreMap = new Map([
  ["tpl-state-1", new DataStore("STATE", {} as any)],
]);

customTemplates.define("my-app.tpl-a", { bricks: [] });

describe("getTplStateStore", () => {
  test("use outside of tpl", () => {
    expect(() => {
      getTplStateStore(
        {
          tplStateStoreId: undefined,
          tplStateStoreMap,
        },
        "STATE.x"
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Using "STATE.x" outside of a custom template"`
    );
  });

  test("state store not found", () => {
    expect(() => {
      getTplStateStore(
        {
          tplStateStoreId: "tpl-state-0",
          tplStateStoreMap,
        },
        "STATE.x"
      );
    }).toThrowErrorMatchingInlineSnapshot(`
      "Template state store is not found when using "STATE.x".
      This is a bug of Brick Next, please report it."
    `);
  });
});

describe("getTplHostElement", () => {
  test("host element not found", () => {
    expect(() => {
      getTplHostElement(
        {
          tplStateStoreId: "tpl-state-1",
          tplStateStoreMap,
        },
        "tpl.dispatchEvent"
      );
    }).toThrowErrorMatchingInlineSnapshot(`
      "Template host element is gone when using "tpl.dispatchEvent".
      This is a bug of Brick Next, please report it."
    `);
  });
});

describe("getTagNameOfCustomTemplate", () => {
  test.each<[string, string | undefined, string | false]>([
    ["tpl-a", "my-app", "my-app.tpl-a"],
    ["tpl-b", "my-app", false],
    ["tpl-a", "unknown-app", false],
    ["my-app.tpl-a", undefined, "my-app.tpl-a"],
    ["my-app.tpl-a", "my-app", "my-app.tpl-a"],
    ["my-app.tpl-b", undefined, false],
  ])(
    "getTagNameOfCustomTemplate(%j, %j) should return %j",
    (brick, appId, tagName) => {
      expect(getTagNameOfCustomTemplate(brick, appId)).toEqual(tagName);
    }
  );
});
