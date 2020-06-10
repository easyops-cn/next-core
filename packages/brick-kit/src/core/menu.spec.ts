import {
  fetchMenuById,
  constructMenu,
  MenuRawData,
  processMenuTitle,
} from "./menu";
import { InstanceApi } from "@sdk/cmdb-sdk";

jest.mock("@sdk/cmdb-sdk");

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
  return Promise.resolve(
    objectId === "OBJECT_B"
      ? {
          name: "Menu B",
        }
      : {
          customName: "Menu C",
        }
  );
});

describe("fetchMenuById", () => {
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
          instanceId: "b",
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
          instanceId: "c",
          attributeId: "customName",
        },
      },
      "Menu C",
    ],
  ])("processMenuTitle(%j) should return %j", async (menuData, title) => {
    expect(await processMenuTitle(menuData, menuData.menuId)).toBe(title);
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
            items: [
              {
                text: "Menu Item 4",
              },
            ],
          },
        ],
      },
    });
  });
});
