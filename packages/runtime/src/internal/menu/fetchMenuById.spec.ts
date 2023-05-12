import { describe, test, expect, jest } from "@jest/globals";
import { initializeI18n } from "@next-core/i18n";
import {
  InstanceApi_getDetail,
  InstanceApi_postSearch,
} from "@next-api-sdk/cmdb-sdk";
import { createProviderClass } from "@next-core/utils/general";
import { fetchMenuById, getMenuById } from "./fetchMenuById.js";
import { _test_only_setBootstrapData } from "../Runtime.js";
import type { RuntimeContext } from "../interfaces.js";

jest.mock("@next-api-sdk/cmdb-sdk");

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

describe("fetchMenuById", () => {
  beforeEach(() => {
    window.STANDALONE_MICRO_APPS = false;
    _test_only_setBootstrapData({});
  });

  test("standalone", async () => {
    window.STANDALONE_MICRO_APPS = true;
    _test_only_setBootstrapData({
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
    } as RuntimeContext;
    await fetchMenuById("menu-a", runtimeContext);
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
    } as RuntimeContext;
    await fetchMenuById("menu-b", runtimeContext);
    expect(getMenuById("menu-b")).toEqual({
      title: "my-host",
      menuItems: [],
    });
  });

  test("showKey", async () => {
    const runtimeContext = {
      app: {
        id: "my-app",
        homepage: "/my-app",
      },
      pendingPermissionsPreCheck: [] as unknown[],
    } as RuntimeContext;
    await fetchMenuById("menu-c", runtimeContext);
    expect(getMenuById("menu-c")).toEqual({
      title: "My(Host)",
      menuItems: [],
    });
  });

  test("dynamic items", async () => {
    _test_only_setBootstrapData({
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
    } as RuntimeContext;
    await fetchMenuById("menu-d", runtimeContext);
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
    _test_only_setBootstrapData({
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
    } as RuntimeContext;
    const promise = fetchMenuById("menu-c", runtimeContext);
    await expect(promise).rejects.toMatchInlineSnapshot(
      `[Error: Menu not found: menu-c]`
    );
  });
});
