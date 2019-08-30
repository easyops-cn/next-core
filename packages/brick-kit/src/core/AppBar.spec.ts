import { getDllAndDepsOfBricks, loadScript } from "@easyops/brick-utils";
import { AppBar } from "./AppBar";
import { Kernel } from "./Kernel";

jest.mock("@easyops/brick-utils");

(getDllAndDepsOfBricks as jest.Mock).mockReturnValue({
  dll: [],
  deps: ["fake.js"]
});
const spyOnLoadScript = loadScript as jest.Mock;

describe("AppBar", () => {
  const appBarElement = document.createElement("div");
  const kernel: Kernel = {
    bootstrapData: {
      navbar: {
        appBar: "p"
      }
    },
    mountPoints: {
      appBar: appBarElement
    }
  } as any;

  afterEach(() => {
    appBarElement.innerHTML = "";
  });

  it("should bootstrap", async () => {
    const appBar = new AppBar(kernel);
    spyOnLoadScript.mockResolvedValueOnce(null);
    await appBar.bootstrap();
    expect(spyOnLoadScript.mock.calls[0][0]).toEqual([]);
    expect(spyOnLoadScript.mock.calls[1][0]).toEqual(["fake.js"]);
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
        text: "first"
      }
    ];
    appBar.appendBreadcrumb([{ text: "second" }]);
    expect(appBar.element.breadcrumb).toEqual([
      {
        text: "first"
      },
      {
        text: "second"
      }
    ]);
  });

  it("should appendBreadcrumb", async () => {
    const appBar = new AppBar(kernel);
    appBar.element = document.createElement("a") as any;
    appBar.element.breadcrumb = [
      {
        text: "first"
      }
    ];
    appBar.setBreadcrumb([{ text: "second" }]);
    expect(appBar.element.breadcrumb).toEqual([
      {
        text: "second"
      }
    ]);
  });
});
