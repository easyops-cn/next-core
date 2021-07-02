import { AppBarBrick } from "@next-core/brick-types";
import { AppBar } from "./AppBar";

describe("AppBar", () => {
  let appBar: AppBar;

  beforeEach(() => {
    appBar = new AppBar(null, "appBar");
    appBar.element = document.createElement("a") as unknown as AppBarBrick;
  });

  it("should setPageTitle", async () => {
    appBar.setPageTitle("hello");
    expect(appBar.element.pageTitle).toBe("hello");
  });

  it("should appendBreadcrumb", async () => {
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

describe("AppBar with no element", () => {
  it("should not throw error", async () => {
    const appBar = new AppBar(null, "appBar");
    appBar.setPageTitle("hello");
    appBar.appendBreadcrumb([{ text: "second" }]);
    appBar.setBreadcrumb([{ text: "second" }]);
    expect(appBar.element).toBe(undefined);
  });
});
