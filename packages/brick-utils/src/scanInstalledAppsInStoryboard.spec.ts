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
                conditional1:
                  "<% INSTALLED_APPS.has(CTX.a ? 'a' : CTX.b ? 'b' : CTX.c ? 'c' : 'd') %>",
                conditional2:
                  "<% INSTALLED_APPS.has(CTX.e ? CTX.f ? 'f' : 'e' : 'g') %>",
                conditional3: "<% INSTALLED_APPS.has(CTX.h ?? 'h') %>",
                conditional4: "<% INSTALLED_APPS.has(CTX.i || 'i') %>",
                conditional5: "<% INSTALLED_APPS.has(CTX.j && 'j') %>",
                conditional6:
                  "<% INSTALLED_APPS.has((CTX.k || CTX.l || 'k') || (CTX.l ?? 'l') || (CTX.m && 'm')) %>",
                conditional7:
                  "<% INSTALLED_APPS.has(CTX.n ? (CTX.o || 'o') : 'n') %>",
                conditional8:
                  "<% INSTALLED_APPS.has(CTX.p || (CTX.q ? 'q' : 'p')) %>",
                conditional9:
                  "<% CTX.r ? INSTALLED_APPS.has('r') : INSTALLED_APPS.has('s') %>",
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
    expect(scanInstalledAppsInStoryboard(storyboard).sort())
      .toMatchInlineSnapshot(`
      Array [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "my-app-in-functions",
        "my-app-in-menus",
        "my-app-in-routes",
        "my-app-in-templates",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
      ]
    `);
  });

  it("should return empty", () => {
    expect(scanInstalledAppsInStoryboard({ routes: null, app: null })).toEqual(
      []
    );
  });
});
