import { MenuBar } from "./MenuBar";
import { Kernel } from "./Kernel";

describe("MenuBar", () => {
  const menuBarElement = document.createElement("div");
  const kernel: Kernel = {
    bootstrapData: {
      navbar: {
        menuBar: "p",
      },
    },
    mountPoints: {
      menuBar: menuBarElement,
    },
    loadDynamicBricks: jest.fn(),
  } as any;

  afterEach(() => {
    (kernel.loadDynamicBricks as jest.Mock).mockClear();
    menuBarElement.innerHTML = "";
  });

  it("should bootstrap", async () => {
    const menuBar = new MenuBar(kernel);
    await menuBar.bootstrap();
    expect(kernel.loadDynamicBricks).toBeCalledWith(["p"]);
    expect(menuBarElement.firstChild.nodeName).toBe("P");
  });

  it("should setAppMenu", async () => {
    const menuBar = new MenuBar(kernel);
    menuBar.element = document.createElement("a") as any;
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
    const menuBar = new MenuBar(kernel);
    menuBar.element = document.createElement("a") as any;
    menuBar.element.collapsed = false;
    expect(menuBar.isCollapsed()).toBe(false);

    menuBar.collapse(true);
    expect(menuBar.element.collapsed).toBe(true);
    expect(menuBar.isCollapsed()).toBe(true);
  });

  it("should softExpand", async () => {
    const menuBar = new MenuBar(kernel);
    menuBar.element = document.createElement("a") as any;
    menuBar.element.softExpanded = false;
    expect(menuBar.isSoftExpanded()).toBe(false);

    menuBar.softExpand(true);
    expect(menuBar.element.softExpanded).toBe(true);
    expect(menuBar.isSoftExpanded()).toBe(true);
  });
});
