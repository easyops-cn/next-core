import { Storyboard } from "@next-core/brick-types";
import {
  scanAppInStoryboard,
  scanAppActionsInAny,
} from "./scanAppInStoryboard";

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
                  any: "<% APP.getMenus('main-menu-1') %>",
                },
              },
            ],
          },
        ],
        functions: [
          {
            source: `
              function test(): string {
                return  APP.getMenus('main-menu-2');
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
                any: "<%  APP.getMenus('main-menu-3') %>",
                selfRef,
              },
            },
          ],
        },
      ],
      app: {
        defaultConfig: {
          bad: "<% APP.getMenus('main-menu-4') %>",
        },
      },
    } as any;
    expect(scanAppInStoryboard(storyboard).sort()).toEqual([
      "main-menu-1",
      "main-menu-2",
      "main-menu-3",
    ]);
  });

  it("should return empty", () => {
    expect(scanAppInStoryboard({ routes: null, app: null })).toEqual([]);
  });
});

describe("scanPermissionActionsInAny", () => {
  it("should work", () => {
    const brickConf = {
      brick: "b-b",
      properties: {
        good: "<% APP.getMenus('menu-1') %>",
        good2: "<% () => APP.getMenus('menu-2') %>",
        good3:
          "<% PERMISSIONS.check('my:action-d') && APP.getMenus('menu-3') %>",
        bad: "<% APP.getMenu(menu-4) %>",
        bad2: "<% APPS.getMenus('menu-5') %>",
        bad3: "<% APP.getMenu('menu-6') %>",
        bad4: "<% APP.getmenus('menu-7') %>",
        bad5: "<% APP.getmenus['menu-7'] %>",
        bad6: "APP.getmenus('menu-8')",
        bad7: "<% APP.getmenus() %>",
        bad8: "<% menu-9 %>",
        bad9: "<% APP.getmenu ('menu-9') %>",
        bad10: "<% (APP) => APP.check('menu-10') %>",
      },
    };
    expect(scanAppActionsInAny(brickConf).sort()).toEqual([
      "menu-1",
      "menu-2",
      "menu-3",
    ]);
  });
});
