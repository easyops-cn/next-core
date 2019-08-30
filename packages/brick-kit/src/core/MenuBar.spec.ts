import { getDllAndDepsOfBricks, loadScript } from "@easyops/brick-utils";
import { MenuBar } from "./MenuBar";
import { Kernel } from "./Kernel";

jest.mock("@easyops/brick-utils");

(getDllAndDepsOfBricks as jest.Mock).mockReturnValue({
  dll: [],
  deps: ["fake.js"]
});
const spyOnLoadScript = loadScript as jest.Mock;

describe("MenuBar", () => {
  const menuBarElement = document.createElement("div");
  const kernel: Kernel = {
    bootstrapData: {
      navbar: {
        menuBar: "p"
      }
    },
    mountPoints: {
      menuBar: menuBarElement
    }
  } as any;

  afterEach(() => {
    menuBarElement.innerHTML = "";
  });

  it("should bootstrap", async () => {
    const menuBar = new MenuBar(kernel);
    spyOnLoadScript.mockResolvedValueOnce(null);
    await menuBar.bootstrap();
    expect(spyOnLoadScript.mock.calls[0][0]).toEqual([]);
    expect(spyOnLoadScript.mock.calls[1][0]).toEqual(["fake.js"]);
    expect(menuBarElement.firstChild.nodeName).toBe("P");
  });

  it("should setAppMenu", async () => {
    const menuBar = new MenuBar(kernel);
    menuBar.element = document.createElement("a") as any;
    menuBar.setAppMenu({
      title: "hello",
      menuItems: []
    });
    expect(menuBar.element.menu).toEqual({
      title: "hello",
      menuItems: []
    });
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
