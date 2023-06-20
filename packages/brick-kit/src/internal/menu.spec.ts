import i18next from "i18next";
import { PluginRuntimeContext, MenuRawData } from "@next-core/brick-types";
import {
  InstanceApi_getDetail,
  InstanceApi_postSearch,
} from "@next-sdk/cmdb-sdk";
import { InstalledMicroAppApi_getMenusInfo } from "@next-sdk/micro-app-sdk";
import { Kernel } from "../core/Kernel";
import {
  fetchMenuById,
  constructMenu,
  preConstructMenus,
  processMenuTitle,
  clearMenuTitleCache,
  clearMenuCache,
  processMenu,
} from "./menu";
import * as runtime from "../core/Runtime";
import { validatePermissions } from "./checkPermissions";

jest.mock("@next-sdk/cmdb-sdk");
jest.mock("@next-sdk/micro-app-sdk");

jest.mock("./checkPermissions", () => ({
  validatePermissions: jest.fn(() => Promise.resolve()),
  checkPermissions: () => true,
}));

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
    titleDataSource: {
      objectId: "",
      instanceId: "",
      attributeId: "",
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
      },
      {
        text: "Menu Item 3",
        to: 'pathname: <% APP.homepage %>\nkeepCurrentSearch:  \n  - aaa  \n  - <% "bbb" %>',
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
    link: "<% APP.homepage %>",
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
        text: "should show",
        to: "${APP.homepage}/4",
        sort: 4,
        if: "<% APP.config.featureFlag %>",
      },
      {
        if: "<% APP.config.count > 10 %>",
        text: "should hide",
        sort: 5,
        to: "${APP.homepage}/5",
      },
    ],
    app: [
      {
        appId: "test-config",
      },
    ],
    overrideApp: {
      id: "test-config",
      homepage: "/test-config",
      defaultConfig: {
        featureFlag: false,
        count: 0,
      },
      userConfig: {
        featureFlag: true,
      },
    },
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
    overrideApp: {
      id: "hola",
      homepage: "/hola",
    },
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
        text: "<% `${I18N('MENU_ITEM')} G 1.2` %>",
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
        text: "<% `${I18N('MENU_ITEM_G')} 1.3` %>",
        to: "${APP.homepage}/3",
        sort: 3,
      },
    ],
    i18n: {
      en: {
        MENU_ITEM_G: "Menu Item G",
      },
    },
    app: [
      {
        appId: "bonjour",
      },
    ],
  },
  {
    menuId: "menu-h",
    type: "main",
    title: "Menu with Permissions",
    items: [
      {
        text: "Menu item with permissions",
        to: "${APP.homepage}/4",
        if: "<% PERMISSIONS.check('abc') %>",
      },
    ],
    app: [
      {
        appId: "hello",
      },
    ],
  },
  {
    menuId: "menu-i",
    title: "Menu i",
    dynamicItems: true,
    itemsResolve: {
      args: ["<% PATH.objectId %>"],
      useProvider: "my.fake-provider",
    },
    items: [
      {
        text: "Menu Item with dynamic arguments",
        sort: 1,
      },
    ],
    app: [
      {
        appId: "hello",
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
(InstalledMicroAppApi_getMenusInfo as jest.Mock).mockImplementation(
  (menuId, params) => {
    return Promise.resolve({
      list: mockMenuList.filter((item) => item.menuId === menuId),
    });
  }
);

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
  const formatData = <T>(item: T): T => JSON.parse(JSON.stringify(item));
  const getFeatureFlags = jest.fn().mockReturnValue({});
  const fakeKernel = { getFeatureFlags } as unknown as Kernel;

  it("should work", async () => {
    const menu1 = await fetchMenuById("menu-a", fakeKernel);
    expect(formatData(menu1)).toEqual({
      menuId: "menu-a",
      items: [],
    });
    const menu2 = await fetchMenuById("menu-a", fakeKernel);
    expect(formatData(menu2)).toEqual({
      menuId: "menu-a",
      items: [],
    });
    const menu3 = await fetchMenuById("menu-b", fakeKernel);
    expect(formatData(menu3)).toEqual({
      menuId: "menu-b",
      items: [],
    });
    getFeatureFlags.mockReturnValueOnce({ "three-level-menu-layout": true });
    const menu4 = await fetchMenuById("menu-b", fakeKernel);
    expect(formatData(menu4)).toEqual({
      menuId: "menu-b",
      items: [],
    });
    await expect(fetchMenuById("menu-x", fakeKernel)).rejects.toBeInstanceOf(
      Error
    );
  });

  it("test clear menu cache", async () => {
    const menu1 = await fetchMenuById("menu-a", fakeKernel);
    expect(formatData(menu1)).toEqual({
      menuId: "menu-a",
      items: [],
    });
    expect(InstanceApi_postSearch).toHaveBeenCalledTimes(1);
    await fetchMenuById("menu-a", fakeKernel);
    expect(InstanceApi_postSearch).toHaveBeenCalledTimes(1);
    clearMenuCache();
    await fetchMenuById("menu-a", fakeKernel);
    expect(InstanceApi_postSearch).toHaveBeenCalledTimes(2);
  });

  it("menu should not cache cache", async () => {
    await fetchMenuById("menu-i", fakeKernel);
    expect(InstanceApi_postSearch).toHaveBeenCalledTimes(1);
    await fetchMenuById("menu-i", fakeKernel);
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
  beforeEach(() => {
    clearMenuTitleCache();
    clearMenuCache();
    jest.clearAllMocks();
    window.STANDALONE_MICRO_APPS = false;
  });

  const context = {
    app: currentApp,
  } as unknown as PluginRuntimeContext;

  it("should ignore if no menuId", async () => {
    const getFeatureFlags = jest.fn().mockReturnValue({});
    const fakeKernel = { getFeatureFlags } as unknown as Kernel;
    const menuBar = {};
    await constructMenu(menuBar, context, fakeKernel);
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
    const fakeKernel = {
      fulfilStoryboardI18n: jest.fn().mockResolvedValue(undefined),
      router: {
        waitForUsedContext: jest.fn().mockResolvedValue(undefined),
      },
      getFeatureFlags: jest.fn().mockReturnValue({}),
    } as unknown as Kernel;
    await constructMenu(menuBar, context, fakeKernel);
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
    expect(fakeKernel.fulfilStoryboardI18n).toBeCalledWith([]);
  });

  it("should construct menu and sub-menu", async () => {
    const menuBar = {
      menuId: "menu-d",
      subMenuId: "sub-menu-e",
    };
    const fakeKernel = {
      fulfilStoryboardI18n: jest.fn().mockResolvedValue(undefined),
      router: {
        waitForUsedContext: jest.fn().mockResolvedValue(undefined),
      },
      getFeatureFlags: jest.fn().mockReturnValue({}),
    } as unknown as Kernel;
    await constructMenu(menuBar, context, fakeKernel);
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
            to: "/hello",
            children: [],
          },
          {
            text: "Menu Item 3",
            to: {
              pathname: "/hello",
              keepCurrentSearch: ["aaa", "bbb"],
            },
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
    expect(fakeKernel.fulfilStoryboardI18n).toBeCalledWith([]);
  });

  it("should construct menu with override app", async () => {
    const menuBar = {
      menuId: "menu-f",
    };
    const fakeKernel = {
      getFeatureFlags: jest.fn().mockReturnValue({}),
      bootstrapData: {
        storyboards: [
          {
            app: {
              id: "hola",
              homepage: "/hola",
            },
          },
          {
            app: {
              id: "test-config",
              homepage: "/test-config",
              config: {
                featureFlag: true,
                count: 0,
              },
              defaultConfig: {
                featureFlag: false,
                count: 0,
              },
              userConfig: {
                featureFlag: true,
              },
            },
          },
        ],
      },
      fulfilStoryboardI18n: jest.fn().mockResolvedValue(undefined),
      router: {
        waitForUsedContext: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as Kernel;
    await constructMenu(menuBar, context, fakeKernel);
    expect(menuBar).toEqual({
      menuId: "menu-f",
      menu: {
        title: "Hello",
        icon: undefined,
        defaultCollapsed: false,
        link: "/hello",
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
          {
            text: "should show",
            to: "/test-config/4",
            children: [],
            sort: 4,
            if: true,
          },
        ],
      },
      subMenu: null,
    });
    expect(fakeKernel.fulfilStoryboardI18n).toBeCalledWith(["hola"]);
  });

  it("should construct menu with override app in standalone mode", async () => {
    const menuBar = {
      menuId: "menu-f",
    };
    const fakeKernel = {
      fulfilStoryboardI18n: jest.fn().mockResolvedValue(undefined),
      router: {
        waitForUsedContext: jest.fn().mockResolvedValue(undefined),
      },
      getStandaloneMenus: jest.fn((menuId, isPrefetch) => {
        return Promise.resolve(
          mockMenuList.filter((item) => item.menuId === menuId)
        );
      }),
      getFeatureFlags: jest.fn().mockReturnValue({}),
    } as unknown as Kernel;
    window.STANDALONE_MICRO_APPS = true;
    await constructMenu(menuBar, context, fakeKernel);
    expect(menuBar).toEqual({
      menuId: "menu-f",
      menu: {
        title: "Hello",
        icon: undefined,
        defaultCollapsed: false,
        link: "/hello",
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
          {
            text: "should show",
            to: "/test-config/4",
            sort: 4,
            if: true,
            children: [],
          },
        ],
      },
      subMenu: null,
    });
    expect(fakeKernel.fulfilStoryboardI18n).toBeCalledWith(["hola"]);
  });

  it("should construct menu with injected group", async () => {
    const menuBar = {
      menuId: "menu-g",
    };
    const fakeKernel = {
      getFeatureFlags: jest.fn().mockReturnValue({}),
      bootstrapData: {
        storyboards: [
          {
            app: {
              id: "hola",
              homepage: "/hola",
            },
          },
          {
            app: {
              id: "bonjour",
              homepage: "/bonjour",
            },
          },
        ],
      },
      fulfilStoryboardI18n: jest.fn().mockResolvedValue(undefined),
      router: {
        waitForUsedContext: jest.fn().mockResolvedValue(undefined),
      },
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
                text: "Opción del menú G 1.2",
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
                to: "/bonjour/3",
                children: [],
              },
            ],
          },
        ],
      },
      subMenu: null,
    });
    expect(fakeKernel.fulfilStoryboardI18n).toBeCalledWith(["hola"]);
  });

  it("preConstructMenus should work", async () => {
    const fakeKernel = {
      fulfilStoryboardI18n: jest.fn().mockResolvedValue(undefined),
      router: {
        waitForUsedContext: jest.fn().mockResolvedValue(undefined),
      },
      getFeatureFlags: jest.fn().mockReturnValue({}),
    } as unknown as Kernel;
    await preConstructMenus(["menu-c", "menu-d"], context, fakeKernel);

    expect(InstanceApi_postSearch).toHaveBeenCalledTimes(2);
  });
});

describe("processMenu", () => {
  beforeEach(() => {
    clearMenuTitleCache();
    clearMenuCache();
    jest.clearAllMocks();
  });

  it("should work", async () => {
    const context = {
      app: currentApp,
    } as unknown as PluginRuntimeContext;
    const fakeKernel = {
      fulfilStoryboardI18n: jest.fn().mockResolvedValue(undefined),
      router: {
        waitForUsedContext: jest.fn().mockResolvedValue(undefined),
      },
      getFeatureFlags: jest.fn().mockReturnValue({}),
    } as unknown as Kernel;
    const menu = await processMenu("menu-h", context, fakeKernel);
    expect(menu).toEqual({
      title: "Menu with Permissions",
      menuItems: [
        {
          if: true,
          text: "Menu item with permissions",
          to: "/hello/4",
          children: [],
        },
      ],
    });
    expect(validatePermissions).toBeCalledWith(["abc"]);
  });
});
