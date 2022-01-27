import { Storyboard } from "@next-core/brick-types";
import {
  scanPermissionActionsInStoryboard,
  scanPermissionActionsInAny,
} from "./scanPermissionActionsInStoryboard";

describe("scanPermissionActionsInStoryboard", () => {
  it("should work", () => {
    const selfRef: Record<string, any> = {
      quality: "good",
    };
    selfRef.ref = selfRef;
    const storyboard: Storyboard = {
      meta: {
        customTemplates: [
          {
            name: "ct-a",
            bricks: [
              {
                brick: "b-x",
                bg: true,
                properties: {
                  any: "<% PERMISSIONS.check('my:action-a') %>",
                },
              },
            ],
          },
        ],
        functions: [
          {
            source: `
              function test(): string {
                return PERMISSIONS.check('my:action-d');
              }
            `,
            typescript: true,
          },
        ],
      },
      routes: [
        {
          bricks: [
            {
              brick: "b-a",
              properties: {
                any: "<% PERMISSIONS.check('my:action-b', 'my:action-c') %>",
                selfRef,
              },
            },
          ],
        },
      ],
      app: {
        defaultConfig: {
          bad: "<% PERMISSIONS.check('my:action-z') %>",
        },
      },
    } as any;
    expect(scanPermissionActionsInStoryboard(storyboard).sort()).toEqual([
      "my:action-a",
      "my:action-b",
      "my:action-c",
      "my:action-d",
    ]);
  });

  it("should return empty", () => {
    expect(
      scanPermissionActionsInStoryboard({ routes: null, app: null })
    ).toEqual([]);
  });
});

describe("scanPermissionActionsInAny", () => {
  it("should work", () => {
    const brickConf = {
      brick: "b-b",
      properties: {
        good: "<% PERMISSIONS.check('my:action-a') %>",
        good2: "<% () => PERMISSIONS.check('my:action-b', 'my:action-c') %>",
        good3:
          "<% PERMISSIONS.check('my:action-d') && PERMISSIONS.check('my:action-e') %>",
        bad: "<% PERMISSIONS.check(bad) %>",
        bad2: "<% PERMISSIONS.check(123) %>",
        bad3: "<% PERMISSIONS.doSomething('my:action-z') %>",
        bad4: "<% PERMISSIONS.check['my:action-y'] %>",
        bad5: "<% ANY.check('my:action-x') %>",
        bad6: "PERMISSIONS.check('my:action-w')",
        bad7: "<% PERMISSIONS.check() %>",
        bad8: "<% 'my:action-v' %>",
        bad9: "<% PERMISSIONS[check]('my:action-u') %>",
        bad10: "<% (PERMISSIONS) => PERMISSIONS.check('my:action-t') %>",
      },
    };
    expect(scanPermissionActionsInAny(brickConf).sort()).toEqual([
      "my:action-a",
      "my:action-b",
      "my:action-c",
      "my:action-d",
      "my:action-e",
    ]);
  });
});
