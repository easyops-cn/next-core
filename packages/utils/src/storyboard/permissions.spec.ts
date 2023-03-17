import { describe, test, expect } from "@jest/globals";
import {
  scanPermissionActionsInAny,
  scanPermissionActionsInStoryboard,
} from "./permissions.js";

describe("scanPermissionActionsInStoryboard", () => {
  test("basic", () => {
    const used = scanPermissionActionsInStoryboard({
      app: null!,
      routes: [
        {
          path: "${APP.homepage}",
          bricks: [
            {
              brick: "div",
              if: "<% PERMISSIONS.check('abc', 'xyz') %>",
            },
          ],
        },
      ],
      meta: {
        customTemplates: [
          {
            name: "tpl-a",
            state: [
              {
                name: "input",
                if: "<% PERMISSIONS['check']('rst') %>",
              },
            ],
            bricks: [],
          },
        ],
        functions: [
          {
            name: "test",
            source: `function test(){
            return PERMISSIONS.check("abc", "def", lmn);
          }`,
          },
        ],
      },
    });
    expect(used).toEqual(["abc", "xyz", "rst", "def"]);
  });

  test("no meta", () => {
    const used = scanPermissionActionsInStoryboard({
      app: null!,
      routes: [],
    });
    expect(used).toEqual([]);
  });
});

describe("scanPermissionActionsInAny", () => {
  test("basic", () => {
    const used = scanPermissionActionsInAny({
      if: "<% PERMISSIONS.check('abc', 'xyz') %>",
    });
    expect(used).toEqual(["abc", "xyz"]);
  });
});
