import { AppBar } from "./AppBar";
import { Kernel } from "./Kernel";

describe("AppBar", () => {
  const appBarElement = document.createElement("div");
  const kernel: Kernel = {
    bootstrapData: {
      navbar: {
        appBar: "p",
      },
    },
    mountPoints: {
      appBar: appBarElement,
    },
    loadDynamicBricks: jest.fn(),
  } as any;

  afterEach(() => {
    appBarElement.innerHTML = "";
  });

  it("should bootstrap", async () => {
    (kernel.loadDynamicBricks as jest.Mock).mockClear();
    const appBar = new AppBar(kernel);
    await appBar.bootstrap();
    expect(kernel.loadDynamicBricks).toBeCalledWith(["p"]);
    expect(appBarElement.firstChild.nodeName).toBe("P");
  });

  it("should setPageTitle", async () => {
    const appBar = new AppBar(kernel);
    appBar.element = document.createElement("a") as any;
    appBar.setPageTitle("hello");
    expect(appBar.element.pageTitle).toBe("hello");
  });

  it("should appendBreadcrumb", async () => {
    const appBar = new AppBar(kernel);
    appBar.element = document.createElement("a") as any;
    appBar.element.breadcrumb = [
      {
        text: "first",
      },
    ];
    appBar.appendBreadcrumb([{ text: "second" }]);
    expect(appBar.element.breadcrumb).toEqual([
      {
        text: "first",
      },
      {
        text: "second",
      },
    ]);
  });

  it("should appendBreadcrumb", async () => {
    const appBar = new AppBar(kernel);
    appBar.element = document.createElement("a") as any;
    appBar.element.breadcrumb = [
      {
        text: "first",
      },
    ];
    appBar.setBreadcrumb([{ text: "second" }]);
    expect(appBar.element.breadcrumb).toEqual([
      {
        text: "second",
      },
    ]);
  });
});
