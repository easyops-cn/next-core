import { MenuNode, normalizeMenu } from "./normalizeMenu";

describe("normalizeMenu", () => {
  it("should work", () => {
    const menus: MenuNode[] = [
      {
        _object_id: "MENU",
        menuId: "menu-a",
        titleDataSource: {
          objectId: "",
          instanceId: "",
          attributeId: "",
        },
        items: [
          {
            if: null,
            _object_id: "MENU_ITEM",
            text: "Menu Item 1",
          },
          {
            if: "<% null %>",
            _object_id: "MENU_ITEM",
            text: "Menu Item 2",
            children: [
              {
                text: "Menu Item 2-1",
                children: [{ text: "Menu Item 2-1-1" }],
              },
            ],
          },
        ],
      },
      {
        _object_id: "MENU",
        menuId: "menu-b",
        dynamicItems: true,
        itemsResolve: {
          useProvider: "my.menu-provider",
        },
      },
    ];
    expect(menus.map(normalizeMenu)).toEqual([
      {
        menuId: "menu-a",
        items: [
          {
            text: "Menu Item 1",
          },
          {
            if: "<% null %>",
            text: "Menu Item 2",
            children: [
              {
                text: "Menu Item 2-1",
                children: [
                  {
                    text: "Menu Item 2-1-1",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        menuId: "menu-b",
        dynamicItems: true,
        itemsResolve: {
          useProvider: "my.menu-provider",
        },
      },
    ]);
  });
});
