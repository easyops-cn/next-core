import { Storyboard } from "@next-core/brick-types";
import {
  scanPermissionActionsInStoryboard,
  scanPermissionActionsInAny,
} from "./scanPermissionActionsInStoryboard";
import { scanInstalledAppsInStoryboard } from "./scanInstalledAppsInStoryboard";

describe("scanInstalledAppsInStoryboard", () => {
  it("should work", () => {
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
                  any: "<% INSTALLED_APPS.has('my-app-in-templates') %>",
                },
              },
            ],
          },
        ],
        functions: [
          {
            source: `
              function test(): string {
                return INSTALLED_APPS.has('my-app-in-functions');
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
                any: "<% INSTALLED_APPS.has('my-app-in-routes') %>",
                bad1: "<% INSTALLED_APP.has('my-app-in-bad1') %>",
                bad2: "<% INSTALLED_APPS.had('my-app-in-bad2') %>",
                bad3: "<% FLAGS['INSTALLED_APPS'] %>",
                bad4: "<% INSTALLED_APPS['has'] %>",
                bad5: "<% INSTALLED_APPS.has(123) %>",
              },
            },
          ],
        },
      ],
      app: {
        defaultConfig: {
          bad: "<% INSTALLED_APPS.has('my-app-in-other) %>",
        },
      },
    } as any;
    expect(scanInstalledAppsInStoryboard(storyboard).sort()).toEqual([
      "my-app-in-functions",
      "my-app-in-routes",
      "my-app-in-templates",
    ]);
  });

  it("should return empty", () => {
    expect(scanInstalledAppsInStoryboard({ routes: null, app: null })).toEqual(
      []
    );
  });
});

// describe("scanPermissionActionsInAny", () => {
//   it("should work", () => {
//     const brickConf = {
//       brick: "b-b",
//       properties: {
//         good: "<% PERMISSIONS.check('my:action-a') %>",
//         good2: "<% () => PERMISSIONS.check('my:action-b', 'my:action-c') %>",
//         good3:
//           "<% PERMISSIONS.check('my:action-d') && PERMISSIONS.check('my:action-e') %>",
//         bad: "<% PERMISSIONS.check(bad) %>",
//         bad2: "<% PERMISSIONS.check(123) %>",
//         bad3: "<% PERMISSIONS.doSomething('my:action-z') %>",
//         bad4: "<% PERMISSIONS.check['my:action-y'] %>",
//         bad5: "<% ANY.check('my:action-x') %>",
//         bad6: "PERMISSIONS.check('my:action-w')",
//         bad7: "<% PERMISSIONS.check() %>",
//         bad8: "<% 'my:action-v' %>",
//         bad9: "<% PERMISSIONS[check]('my:action-u') %>",
//         bad10: "<% (PERMISSIONS) => PERMISSIONS.check('my:action-t') %>",
//       },
//     };
//     expect(scanPermissionActionsInAny(brickConf).sort()).toEqual([
//       "my:action-a",
//       "my:action-b",
//       "my:action-c",
//       "my:action-d",
//       "my:action-e",
//     ]);
//   });
// });
