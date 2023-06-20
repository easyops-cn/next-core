import { describe, test, expect, jest } from "@jest/globals";
import { initializeI18n } from "@next-core/i18n";
import {
  InstanceApi_PostSearchResponseBody,
  InstanceApi_getDetail,
  InstanceApi_postSearch,
} from "@next-api-sdk/cmdb-sdk";
import { InstalledMicroAppApi_getMenusInfo } from "@next-api-sdk/micro-app-sdk";
import { createProviderClass } from "@next-core/utils/general";
import { __test_only } from "@next-core/runtime";
import { fetchMenuById, getMenuById } from "./fetchMenuById.js";
import type { RuntimeContext, RuntimeHelpers } from "./interfaces.js";

jest.mock("@next-api-sdk/cmdb-sdk");
jest.mock("@next-api-sdk/micro-app-sdk");

initializeI18n();

const myTimeoutProvider = jest.fn(
  (timeout: number, result: unknown) =>
    new Promise((resolve) => {
      setTimeout(() => resolve(result), timeout);
    })
);
customElements.define(
  "my-timeout-provider",
  createProviderClass(myTimeoutProvider)
);

const menuList = [
  {
    menuId: "menu-b",
    titleDataSource: {
      objectId: "HOST",
      instanceId: "host-1",
    },
    items: [
      {
        if: null,
        text: "Menu Item 1",
        to: "<% APP.homepage %>",
      },
      {
        if: "<% null %>",
        text: "Menu Item 2",
        to: "",
      },
      {
        text: "Menu Item 3",
        to: 'pathname: <% APP.homepage %>\nkeepCurrentSearch:  \n  - aaa  \n  - <% "bbb" %>',
      },
      {
        text: "Menu Item 4",
        to: " ",
      },
    ],
    app: [
      {
        appId: "my-app",
      },
    ],
  },
  {
    menuId: "menu-c",
    titleDataSource: {
      objectId: "HOST",
      instanceId: "host-2",
      attributeId: "#showKey",
    },
    app: [
      {
        appId: "my-app",
      },
    ],
  },
  {
    menuId: "menu-d",
    titleDataSource: {
      objectId: "HOST",
      instanceId: "host-3",
      attributeId: "#showKey",
    },
    app: [
      {
        appId: "my-app",
      },
    ],
  },
  {
    menuId: "menu-d",
    type: "inject",
    title: "<% 'Menu D' %>",
    app: [
      {
        appId: "my-app",
      },
    ],
    dynamicItems: true,
    itemsResolve: {
      useProvider: "my-timeout-provider",
      args: [
        1,
        [
          {
            text: "Dynamic Item 1",
            to: "<% `${APP.homepage}/dynamic/1` %>",
          },
          {
            text: "Dynamic Item 2",
          },
        ],
      ],
    },
  },
  {
    menuId: "menu-d",
    type: "inject",
    title: "<% 'Menu D' %>",
    dynamicItems: true,
    itemsResolve: {
      useProvider: "my-timeout-provider",
      args: [
        1,
        [
          {
            text: "<% `Dynamic ${I18N('ITEM_3')}` %>",
            to: "<% `${APP.homepage}/dynamic/3` %>",
          },
          {
            text: "Dynamic Item 4",
          },
        ],
      ],
    },
    app: [
      {
        appId: "other-app",
      },
    ],
    i18n: {
      en: { ITEM_3: "Item 3" },
    },
  },
];

(
  InstanceApi_postSearch as jest.Mock<typeof InstanceApi_postSearch>
).mockImplementation(async (objectId, data: any) => {
  return {
    list: menuList.filter((menu) => menu.menuId === data.query.menuId.$eq),
  };
});
(
  InstalledMicroAppApi_getMenusInfo as jest.Mock<typeof InstanceApi_postSearch>
).mockImplementation(async (menuId, params) => {
  return {
    menus: menuList.filter((menu) => menu.menuId === menuId),
  } as InstanceApi_PostSearchResponseBody;
});

(
  InstanceApi_getDetail as jest.Mock<typeof InstanceApi_getDetail>
).mockImplementation(async (objectId, instanceId) => {
  switch (objectId) {
    case "HOST":
      switch (instanceId) {
        case "host-1":
          return { name: "my-host" };
        case "host-2":
          return { ["#showKey"]: ["My", "Host"] };
        case "host-3":
          return { ["#showKey"]: ["My Host"] };
      }
  }
  throw new Error("Instance not found");
});

const runtimeHelpers: RuntimeHelpers = __test_only;

describe("fetchMenuById", () => {
  beforeEach(() => {
    window.STANDALONE_MICRO_APPS = false;
  });

  test("standalone", async () => {
    window.STANDALONE_MICRO_APPS = true;
    __test_only.setBootstrapData({
      storyboards: [
        {
          app: {
            id: "my-app",
            homepage: "/my-app",
          },
          meta: {
            injectMenus: [
              {
                menuId: "menu-a",
                instanceId: "menu-instance-1",
                title: "<% 'Menu A' %>",
                titleDataSource: {
                  objectId: "",
                  instanceId: "",
                  attributeId: "",
                },
                type: "main",
                items: [
                  {
                    text: "Menu A - Item 1",
                    to: "<% `${APP.homepage}/a/1` %>",
                    sort: 10,
                  },
                  {
                    text: "Menu A - Item 2",
                    sort: 20,
                  },
                  {
                    text: "Menu A - Group X",
                    type: "group",
                    groupId: "group-x",
                    sort: 30,
                    children: [
                      {
                        text: "Group X - i",
                      },
                    ],
                  },
                  {
                    text: "Menu A - Sub",
                    sort: 40,
                    children: [
                      {
                        text: "Sub",
                      },
                    ],
                  },
                ],
              },
              {
                menuId: "menu-a",
                instanceId: "menu-instance-2",
                type: "inject",
                items: [
                  {
                    text: "<% `Menu A - ${I18N('ITEM_0')}` %>",
                    to: "<% `${APP.homepage}/a/0` %>",
                  },
                  {
                    text: "Menu A - Item 1.1",
                    sort: 15,
                  },
                  {
                    text: "Menu A - Item 2.1",
                    sort: 25,
                  },
                ],
                app: [
                  {
                    appId: "other-app",
                  },
                ],
                overrideApp: {
                  id: "other-app",
                  homepage: "/other-app",
                },
                i18n: {
                  en: {
                    ITEM_0: "Item 0",
                  },
                },
              },
              {
                menuId: "menu-a",
                instanceId: "menu-instance-3",
                injectMenuGroupId: "group-x",
                type: "inject",
                items: [
                  {
                    text: "Group X - ii",
                    sort: 1,
                  },
                ],
              },
              {
                menuId: "menu-a",
                instanceId: "menu-instance-4",
                injectMenuGroupId: "group-x",
                type: "inject",
                items: [
                  {
                    text: "Group X - iii",
                    sort: 2,
                  },
                ],
              },
              {
                menuId: "menu-a",
                type: "inject",
                dynamicItems: true,
                itemsResolve: {
                  useProvider: "my-timeout-provider",
                  args: [
                    1,
                    [
                      {
                        text: "<% `Dynamic ${I18N('ITEM_9')}` %>",
                        to: "<% `${APP.homepage}/dynamic/9` %>",
                        sort: 35,
                      },
                    ],
                  ],
                },
                app: [
                  {
                    appId: "other-app",
                  },
                ],
                overrideApp: {
                  id: "other-app",
                  homepage: "/other-app",
                },
                i18n: {
                  en: {
                    ITEM_9: "Item 9",
                  },
                },
              },
              {
                menuId: "menu-a",
                instanceId: "menu-instance-5",
              },
            ],
          },
        },
      ],
    } as any);
    const runtimeContext = {
      app: {
        id: "my-app",
        homepage: "/my-app",
      },
      pendingPermissionsPreCheck: [] as unknown[],
      flags: {},
    } as RuntimeContext;
    await fetchMenuById("menu-a", runtimeContext, runtimeHelpers);
    expect(getMenuById("menu-a")).toEqual({
      title: "Menu A",
      menuItems: [
        {
          text: "Menu A - Item 0",
          to: "/other-app/a/0",
          children: [],
        },
        {
          text: "Menu A - Item 1",
          to: "/my-app/a/1",
          sort: 10,
          children: [],
        },
        {
          text: "Menu A - Item 1.1",
          sort: 15,
          children: [],
        },
        {
          text: "Menu A - Item 2",
          sort: 20,
          children: [],
        },
        {
          text: "Menu A - Item 2.1",
          sort: 25,
          children: [],
        },
        {
          title: "Menu A - Group X",
          type: "group",
          items: [
            {
              text: "Group X - i",
              children: [],
            },
            {
              text: "Group X - ii",
              sort: 1,
              children: [],
            },
            {
              text: "Group X - iii",
              sort: 2,
              children: [],
            },
          ],
        },
        {
          text: "Dynamic Item 9",
          to: "/other-app/dynamic/9",
          sort: 35,
          children: [],
        },
        {
          title: "Menu A - Sub",
          type: "subMenu",
          items: [
            {
              text: "Sub",
              children: [],
            },
          ],
        },
      ],
    });
  });

  test("non-standalone", async () => {
    const runtimeContext = {
      app: {
        id: "my-app",
        homepage: "/my-app",
      },
      pendingPermissionsPreCheck: [] as unknown[],
      flags: { "three-level-menu-layout": true },
    } as unknown as RuntimeContext;
    await fetchMenuById("menu-b", runtimeContext, runtimeHelpers);
    expect(getMenuById("menu-b")).toEqual({
      title: "my-host",
      menuItems: [
        {
          children: [],
          to: "/my-app",
          text: "Menu Item 1",
        },
        {
          children: [],
          text: "Menu Item 3",
          to: {
            pathname: "/my-app",
            keepCurrentSearch: ["aaa", "bbb"],
          },
        },
        {
          children: [],
          to: "",
          text: "Menu Item 4",
        },
      ],
    });
  });

  test("showKey", async () => {
    const runtimeContext = {
      app: {
        id: "my-app",
        homepage: "/my-app",
      },
      pendingPermissionsPreCheck: [] as unknown[],
      flags: {},
    } as RuntimeContext;
    await fetchMenuById("menu-c", runtimeContext, runtimeHelpers);
    expect(getMenuById("menu-c")).toEqual({
      title: "My(Host)",
      menuItems: [],
    });
  });

  test("dynamic items", async () => {
    __test_only.setBootstrapData({
      storyboards: [
        {
          app: {
            id: "other-app",
            homepage: "/other-app",
          },
        },
      ],
    } as any);
    const runtimeContext = {
      app: {
        id: "my-app",
        homepage: "/my-app",
      },
      pendingPermissionsPreCheck: [] as unknown[],
      flags: {},
    } as RuntimeContext;
    await fetchMenuById("menu-d", runtimeContext, runtimeHelpers);
    expect(getMenuById("menu-d")).toEqual({
      title: "My Host",
      menuItems: [
        {
          text: "Dynamic Item 1",
          to: "/my-app/dynamic/1",
          children: [],
        },
        {
          text: "Dynamic Item 2",
          children: [],
        },
        {
          text: "Dynamic Item 3",
          to: "/other-app/dynamic/3",
          children: [],
        },
        {
          text: "Dynamic Item 4",
          children: [],
        },
      ],
    });
  });

  test("menu not found", async () => {
    window.STANDALONE_MICRO_APPS = true;
    __test_only.setBootstrapData({
      storyboards: [
        {
          app: {
            id: "my-app",
            homepage: "/my-app",
          },
          meta: {
            menus: [
              {
                menuId: "menu-b",
                title: "Menu B",
                app: [
                  {
                    appId: "my-app",
                  },
                ],
              },
            ],
          },
        },
      ],
    } as any);
    const runtimeContext = {
      app: {
        id: "my-app",
        homepage: "/my-app",
      },
      pendingPermissionsPreCheck: [] as unknown[],
      flags: {},
    } as RuntimeContext;
    const promise = fetchMenuById("menu-c", runtimeContext, runtimeHelpers);
    await expect(promise).rejects.toMatchInlineSnapshot(
      `[Error: Menu not found: menu-c]`
    );
  });
});
