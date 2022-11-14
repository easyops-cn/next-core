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
        menus: [
          {
            menuId: "test-menu-id",
            items: [
              {
                if: "<% INSTALLED_APPS.has('my-app-in-menus') %>",
              },
            ],
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
      "my-app-in-menus",
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
