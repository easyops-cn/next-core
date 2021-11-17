import i18next from "i18next";
import { PluginRuntimeContext } from "@next-core/brick-types";
import {
  InstanceApi_getDetail,
  InstanceApi_postSearch,
} from "@next-sdk/cmdb-sdk";
import { Kernel } from "../core/Kernel";
import {
  fetchMenuById,
  constructMenu,
  MenuRawData,
  processMenuTitle,
  clearMenuTitleCache,
  clearMenuCache,
} from "./menu";
import * as runtime from "../core/Runtime";

jest.mock("@next-sdk/cmdb-sdk");

i18next.init({
  fallbackLng: "en",
});
i18next.addResourceBundle("en", "$app-hello", {
  HELLO: "Hello",
  MENU_ITEM: "Menu item",
});
i18next.addResourceBundle("en", "$app-hola", {
  HELLO: "Hola",
  MENU_ITEM: "Opción del menú",
});

const currentApp = {
  id: "hello",
  homepage: "/hello",
};
jest.spyOn(runtime, "_internalApiGetCurrentContext").mockReturnValue({
  flags: {},
  app: currentApp,
} as any);

const mockResolveOne = jest.fn((_a, resolveConf, itemsConf) => {
  itemsConf.items = [
    {
      text: `Menu Item From ${resolveConf.useProvider}`,
      sort: 10,
    },
  ];
  return Promise.resolve();
});
jest.spyOn(runtime, "_internalApiGetResolver").mockReturnValue({
  resolveOne: mockResolveOne,
} as any);

const mockMenuList: any[] = [
  {
    menuId: "menu-a",
  },
  {
    menuId: "menu-b",
  },
  {
    menuId: "menu-c",
    title: "Menu C",
    items: [],
    app: [
      {
        appId: "hello",
      },
    ],
  },
  {
    menuId: "menu-d",
    title: "Menu D",
    items: [
      {
        text: "Menu Item 1",
      },
    ],
    app: [
      {
        appId: "hello",
      },
    ],
  },
  {
    menuId: "sub-menu-e",
    title: "Sub Menu E (Injected)",
    type: "inject",
    items: [
      {
        text: "Menu Item 3",
        sort: 2,
        defaultExpanded: true,
        children: [
          {
            text: "Menu Item 4",
            children: [],
          },
        ],
      },
    ],
    app: [
      {
        appId: "hello",
      },
    ],
  },
  {
    menuId: "sub-menu-e",
    title: "Sub Menu E",
    items: [
      {
        text: "Menu Item 2",
        sort: 1,
      },
      {
        text: "Menu Item 0",
        if: "<% FLAGS['flag-not-enabled'] %>",
        sort: 5,
      },
    ],
    app: [
      {
        appId: "hello",
      },
    ],
  },
  {
    menuId: "sub-menu-e",
    title: "Sub Menu E",
    dynamicItems: true,
    itemsResolve: {
      useProvider: "my.fake-provider",
    },
    items: [
      {
        text: "Menu Item Will Be Ignored",
        sort: 1,
      },
    ],
    app: [
      {
        appId: "hello",
      },
    ],
  },
  {
    menuId: "menu-f",
    title: "<% I18N('HELLO') %>",
    items: [
      {
        text: "<% I18N('MENU_ITEM') %>",
        to: "${APP.homepage}",
        sort: 1,
      },
    ],
    app: [
      {
        appId: "hello",
      },
    ],
  },
  {
    menuId: "menu-f",
    title: "<% I18N('HELLO') %>",
    type: "inject",
    items: [
      {
        text: "<% I18N('MENU_ITEM') %>",
        to: "${APP.homepage}/1",
        sort: 2,
      },
      {
        if: "<% !FLAGS['flag-not-enabled'] %>",
        text: "Fixed item",
        activeIncludes: ["/any"],
        sort: 3,
        to: "${APP.homepage}/2",
      },
    ],
    app: [
      {
        appId: "hola",
      },
    ],
  },
  {
    menuId: "menu-g",
    title: "Hello",
    items: [
      {
        text: "Menu Item G 1",
        groupId: "group-g-1",
        children: [
          {
            text: "Menu Item G 1.1",
            to: "${APP.homepage}/1",
            sort: 2,
          },
        ],
      },
    ],
    app: [
      {
        appId: "hello",
      },
    ],
  },
  {
    menuId: "menu-g",
    type: "inject",
    injectMenuGroupId: "group-g-1",
    title: "Injecting Hello",
    items: [
      {
        text: "Menu Item G 1.2",
        to: "${APP.homepage}/2",
        sort: 1,
      },
    ],
    app: [
      {
        appId: "hola",
      },
    ],
  },
  {
    menuId: "menu-g",
    type: "inject",
    injectMenuGroupId: "group-g-1",
    title: "Injecting Hello",
    items: [
      {
        text: "Menu Item G 1.3",
        to: "${APP.homepage}/3",
        sort: 3,
      },
    ],
    app: [
      {
        appId: "bonjour",
      },
    ],
  },
];

(InstanceApi_postSearch as jest.Mock).mockImplementation((objectId, params) => {
  return Promise.resolve({
    list: mockMenuList.filter(
      (item) => item.menuId === params.query.menuId.$eq
    ),
  });
});

(InstanceApi_getDetail as jest.Mock).mockImplementation((objectId) => {
  switch (objectId) {
    case "OBJECT_B":
      return Promise.resolve({ name: "Menu B" });
    case "OBJECT_C":
      return Promise.resolve({ customName: "Menu C" });
    case "OBJECT_D":
      return Promise.resolve({ "#showKey": "Menu D" });
    case "OBJECT_E":
      return Promise.resolve({ "#showKey": ["Menu E"] });
    case "OBJECT_F":
      return Promise.resolve({ "#showKey": ["Menu F", "one"] });
    case "OBJECT_G":
      return Promise.resolve({ "#showKey": ["Menu G", "one", "two"] });
  }
});

describe("fetchMenuById", () => {
  beforeEach(() => {
    clearMenuTitleCache();
    clearMenuCache();
    jest.clearAllMocks();
  });

  it("should work", async () => {
    const menu1 = await fetchMenuById("menu-a", null);
    expect(menu1).toEqual({
      menuId: "menu-a",
      items: [],
    });
    const menu2 = await fetchMenuById("menu-a", null);
    expect(menu2).toEqual({
      menuId: "menu-a",
      items: [],
    });
    const menu3 = await fetchMenuById("menu-b", null);
    expect(menu3).toEqual({
      menuId: "menu-b",
      items: [],
    });
    await expect(fetchMenuById("menu-x", null)).rejects.toBeInstanceOf(Error);
  });

  it("test clear menu cache", async () => {
    const menu1 = await fetchMenuById("menu-a", null);
    expect(menu1).toEqual({
      menuId: "menu-a",
      items: [],
    });
    expect(InstanceApi_postSearch).toHaveBeenCalledTimes(1);
    await fetchMenuById("menu-a", null);
    expect(InstanceApi_postSearch).toHaveBeenCalledTimes(1);
    clearMenuCache();
    await fetchMenuById("menu-a", null);
    expect(InstanceApi_postSearch).toHaveBeenCalledTimes(2);
  });
});

describe("processMenuTitle", () => {
  it.each<[MenuRawData, string]>([
    [
      {
        menuId: "menu-a",
        title: "Menu A",
      },
      "Menu A",
    ],
    [
      {
        menuId: "menu-b",
        title: "",
        titleDataSource: {
          objectId: "OBJECT_B",
          instanceId: "any",
        },
      },
      "Menu B",
    ],
    [
      {
        menuId: "menu-c",
        title: "",
        titleDataSource: {
          objectId: "OBJECT_C",
          instanceId: "any",
          attributeId: "customName",
        },
      },
      "Menu C",
    ],
    [
      {
        menuId: "menu-D",
        title: "",
        titleDataSource: {
          objectId: "OBJECT_D",
          instanceId: "any",
          attributeId: "#showKey",
        },
      },
      "Menu D",
    ],
    [
      {
        menuId: "menu-E",
        title: "",
        titleDataSource: {
          objectId: "OBJECT_E",
          instanceId: "any",
          attributeId: "#showKey",
        },
      },
      "Menu E",
    ],
    [
      {
        menuId: "menu-F",
        title: "",
        titleDataSource: {
          objectId: "OBJECT_F",
          instanceId: "any",
          attributeId: "#showKey",
        },
      },
      "Menu F(one)",
    ],
    [
      {
        menuId: "menu-G",
        title: "",
        titleDataSource: {
          objectId: "OBJECT_G",
          instanceId: "any",
          attributeId: "#showKey",
        },
      },
      "Menu G(one,two)",
    ],
  ])("processMenuTitle(%j) should return %j", async (menuData, title) => {
    expect(await processMenuTitle(menuData)).toBe(title);
  });
});

describe("constructMenu", () => {
  const context = {
    app: currentApp,
  } as unknown as PluginRuntimeContext;

  it("should ignore if no menuId", async () => {
    const menuBar = {};
    await constructMenu(menuBar, context, null);
    expect(menuBar).toEqual({
      subMenu: null,
    });
  });

  it("should construct menu", async () => {
    const menuBar = {
      menuId: "menu-c",
      menu: {
        defaultCollapsed: true,
      },
    };
    await constructMenu(menuBar, context, null);
    expect(menuBar).toEqual({
      menuId: "menu-c",
      menu: {
        title: "Menu C",
        icon: undefined,
        defaultCollapsed: true,
        menuItems: [],
      },
      subMenu: null,
    });
  });

  it("should construct menu and sub-menu", async () => {
    const menuBar = {
      menuId: "menu-d",
      subMenuId: "sub-menu-e",
    };
    await constructMenu(menuBar, context, null);
    expect(menuBar).toEqual({
      menuId: "menu-d",
      subMenuId: "sub-menu-e",
      menu: {
        title: "Menu D",
        icon: undefined,
        defaultCollapsed: true,
        menuItems: [
          {
            text: "Menu Item 1",
            children: [],
          },
        ],
      },
      subMenu: {
        title: "Sub Menu E",
        icon: undefined,
        menuItems: [
          {
            text: "Menu Item 2",
            sort: 1,
            children: [],
          },
          {
            type: "subMenu",
            title: "Menu Item 3",
            icon: undefined,
            defaultExpanded: true,
            items: [
              {
                text: "Menu Item 4",
                children: [],
              },
            ],
          },
          {
            text: "Menu Item From my.fake-provider",
            sort: 10,
            children: [],
          },
        ],
      },
    });
  });

  it("should construct menu with override app", async () => {
    const menuBar = {
      menuId: "menu-f",
    };
    const fakeKernel = {
      bootstrapData: {
        storyboards: [
          {
            app: {
              id: "hola",
              homepage: "/hola",
            },
          },
        ],
      },
      fulfilStoryboard: jest.fn(),
    } as unknown as Kernel;
    await constructMenu(menuBar, context, fakeKernel);
    expect(menuBar).toEqual({
      menuId: "menu-f",
      menu: {
        title: "Hello",
        icon: undefined,
        defaultCollapsed: false,
        menuItems: [
          {
            text: "Menu item",
            to: "/hello",
            children: [],
            sort: 1,
          },
          {
            text: "Opción del menú",
            to: "/hola/1",
            children: [],
            sort: 2,
          },
          {
            if: true,
            text: "Fixed item",
            activeIncludes: ["/any"],
            sort: 3,
            to: "/hola/2",
            children: [],
          },
        ],
      },
      subMenu: null,
    });
  });

  it("should construct menu with injected group", async () => {
    const menuBar = {
      menuId: "menu-g",
    };
    const fakeKernel = {
      bootstrapData: {
        storyboards: [
          {
            app: {
              id: "hola",
              homepage: "/hola",
            },
          },
        ],
      },
      fulfilStoryboard: jest.fn(),
    } as unknown as Kernel;
    await constructMenu(menuBar, context, fakeKernel);
    expect(menuBar).toEqual({
      menuId: "menu-g",
      menu: {
        title: "Hello",
        icon: undefined,
        defaultCollapsed: false,
        menuItems: [
          {
            type: "subMenu",
            title: "Menu Item G 1",
            items: [
              {
                text: "Menu Item G 1.2",
                to: "/hola/2",
                children: [],
                sort: 1,
              },
              {
                text: "Menu Item G 1.1",
                sort: 2,
                to: "/hello/1",
                children: [],
              },
              {
                text: "Menu Item G 1.3",
                sort: 3,
                to: "/hello/3",
                children: [],
              },
            ],
          },
        ],
      },
      subMenu: null,
    });
  });
});
