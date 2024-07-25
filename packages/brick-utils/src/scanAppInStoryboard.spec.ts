import { Storyboard } from "@next-core/brick-types";
import {
  scanAppGetMenuInStoryboard,
  scanAppGetMenuInAny,
} from "./scanAppInStoryboard";

jest.spyOn(console, "error").mockImplementation();

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
                  any: "<% APP.getMenu('main-menu-1') %>",
                  ignore: "<% APP.config.abc %>",
                },
              },
            ],
          },
        ],
        functions: [
          {
            source: `
              function test(): string {
                return  APP.getMenu('main-menu-2');
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
                any: "<%  APP.getMenu('main-menu-3') %>",
                selfRef,
              },
            },
          ],
        },
      ],
      app: {
        defaultConfig: {
          bad: "<% APP.getMenu('main-menu-4') %>",
        },
      },
    } as any;
    expect(scanAppGetMenuInStoryboard(storyboard).sort()).toEqual([
      "main-menu-1",
      // "main-menu-2",
      "main-menu-3",
    ]);
  });

  it("should return empty", () => {
    expect(scanAppGetMenuInStoryboard({ routes: null, app: null })).toEqual([]);
  });
});

describe("scanPermissionActionsInAny", () => {
  it("should work", () => {
    const brickConf = {
      brick: "b-b",
      properties: {
        good: "<% APP.getMenu('menu-1') %>",
        good2: "<% () => APP.getMenu('menu-2') %>",
        good3:
          "<% PERMISSIONS.check('my:action-d') && APP.getMenu('menu-3') %>",
        bad: "<% APP.getMenus(menu-4) %>",
        bad2: "<% APPS.getMenu('menu-5') %>",
        bad3: "<% APPS.getMenus('menu-6') %>",
        bad4: "<% APP.getmenus('menu-7') %>",
        bad5: "<% APP.getMenu['menu-7'] %>",
        bad6: "APP.getmenus('menu-8')",
        bad7: "<% APP.getMenu() %>",
        bad8: "<% menu-9 %>",
        bad9: "<% APP.getMenu('menu-9' %>",
        bad10: "<% (APP) => APP.check('menu-10') %>",
        bad11: "<% APP.getMenu('menu-11', 'menu-12') %>",
        ignore: "<% APP.config.abc %>",
      },
    };
    expect(scanAppGetMenuInAny(brickConf).sort()).toEqual([
      "menu-1",
      "menu-2",
      "menu-3",
    ]);
  });
});
