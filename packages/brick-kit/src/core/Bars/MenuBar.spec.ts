import { MenuBarBrick } from "@next-core/brick-types";
import { MenuBar } from "./MenuBar";

describe("MenuBar", () => {
  let menuBar: MenuBar;

  beforeEach(() => {
    menuBar = new MenuBar(null, "menuBar");
    menuBar.element = document.createElement("a") as unknown as MenuBarBrick;
  });

  it("should setAppMenu", async () => {
    menuBar.setAppMenu({
      title: "hello",
      menuItems: [],
    });
    expect(menuBar.element.menu).toEqual({
      title: "hello",
      menuItems: [],
    });

    menuBar.resetAppMenu();
    expect(menuBar.element.menu).toBe(null);
    expect(menuBar.element.subMenu).toBe(null);
  });

  it("should collapse", async () => {
    menuBar.element.collapsed = false;
    expect(menuBar.isCollapsed()).toBe(false);

    menuBar.collapse(true);
    expect(menuBar.element.collapsed).toBe(true);
    expect(menuBar.isCollapsed()).toBe(true);
  });

  it("should softExpand", async () => {
    menuBar.element.softExpanded = false;
    expect(menuBar.isSoftExpanded()).toBe(false);

    menuBar.softExpand(true);
    expect(menuBar.element.softExpanded).toBe(true);
    expect(menuBar.isSoftExpanded()).toBe(true);
  });
});

describe("MenuBar with no element", () => {
  it("should not throw error", async () => {
    const menuBar = new MenuBar(null, "menuBar");
    menuBar.setAppMenu({
      title: "hello",
      menuItems: [],
    });
    menuBar.resetAppMenu();
    menuBar.collapse(true);
    menuBar.softExpand(true);
    expect(menuBar.isCollapsed()).toBe(undefined);
    expect(menuBar.isSoftExpanded()).toBe(undefined);
    expect(menuBar.element).toBe(undefined);
  });
});
