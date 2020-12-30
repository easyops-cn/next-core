import { InstanceApi } from "@sdk/cmdb-sdk";
import {
  fetchMenuById,
  constructMenu,
  MenuRawData,
  processMenuTitle,
  clearMenuTitleCache,
  clearMenuCache,
} from "./menu";
import * as runtime from "./Runtime";

jest.mock("@sdk/cmdb-sdk");

jest.spyOn(runtime, "_internalApiGetCurrentContext").mockReturnValue({
  flags: {},
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
  },
  {
    menuId: "menu-d",
    title: "Menu D",
    items: [
      {
        text: "Menu Item 1",
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
          },
        ],
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
  },
];

jest.spyOn(InstanceApi, "postSearch").mockImplementation((objectId, params) => {
  return Promise.resolve({
    list: mockMenuList.filter(
      (item) => item.menuId === params.query.menuId.$eq
    ),
  });
});

jest.spyOn(InstanceApi, "getDetail").mockImplementation((objectId) => {
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
    const menu1 = await fetchMenuById("menu-a");
    expect(menu1).toEqual({
      menuId: "menu-a",
      items: [],
    });
    const menu2 = await fetchMenuById("menu-a");
    expect(menu2).toEqual({
      menuId: "menu-a",
      items: [],
    });
    const menu3 = await fetchMenuById("menu-b");
    expect(menu3).toEqual({
      menuId: "menu-b",
      items: [],
    });
    await expect(fetchMenuById("menu-x")).rejects.toBeInstanceOf(Error);
  });

  it("test clear menu cache", async () => {
    const menu1 = await fetchMenuById("menu-a");
    expect(menu1).toEqual({
      menuId: "menu-a",
      items: [],
    });
    expect(InstanceApi.postSearch).toHaveBeenCalledTimes(1);
    await fetchMenuById("menu-a");
    expect(InstanceApi.postSearch).toHaveBeenCalledTimes(1);
    clearMenuCache();
    await fetchMenuById("menu-a");
    expect(InstanceApi.postSearch).toHaveBeenCalledTimes(2);
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
  it("should ignore if no menuId", async () => {
    const menuBar = {};
    await constructMenu(menuBar, null);
    expect(menuBar).toEqual({
      subMenu: null,
    });
  });

  it("should construct menu", async () => {
    const menuBar = {
      menuId: "menu-c",
    };
    await constructMenu(menuBar, null);
    expect(menuBar).toEqual({
      menuId: "menu-c",
      menu: {
        title: "Menu C",
        icon: undefined,
        defaultCollapsed: false,
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
    await constructMenu(menuBar, null);
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
});
