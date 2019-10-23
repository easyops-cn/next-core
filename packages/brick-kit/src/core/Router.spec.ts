import {
  loadScript,
  getDllAndDepsOfStoryboard,
  getTemplateDepsOfStoryboard
} from "@easyops/brick-utils";
import { getHistory } from "../history";
import { Router } from "./Router";
import { Kernel } from "./Kernel";
import {
  // @ts-ignore
  __setMatchedStoryboard,
  // @ts-ignore
  __setMountRoutesResults
} from "./LocationContext";
import { mountTree, mountStaticNode } from "./reconciler";

jest.mock("@easyops/brick-utils");
jest.mock("../history");
jest.mock("./LocationContext");
jest.mock("./reconciler");

const spyOnGetHistory = getHistory as jest.Mock;
const spyOnLoadScript = loadScript as jest.Mock;
const spyOnMountTree = mountTree as jest.Mock;
const spyOnMountStaticNode = mountStaticNode as jest.Mock;
const spyOnDispatchEvent = jest.spyOn(window, "dispatchEvent");
const spyOnGetDllAndDepsOfStoryboard = getDllAndDepsOfStoryboard as jest.Mock;
const spyOnGetTemplateDepsOfStoryboard = getTemplateDepsOfStoryboard as jest.Mock;

const spyOnHistoryListen = jest.fn();
const spyOnHistoryReplace = jest.fn();
spyOnGetHistory.mockReturnValue({
  location: {},
  listen: spyOnHistoryListen,
  replace: spyOnHistoryReplace,
  createHref: () => "/oops"
});

(window as any).DLL_HASH = {
  d3: "fake-hash"
};

describe("Router", () => {
  let router: Router;
  const kernel: Kernel = {
    mountPoints: {
      main: document.createElement("div"),
      bg: document.createElement("div")
    },
    bootstrapData: {
      storyboards: [],
      brickPackages: [
        {
          filePath: "all.js"
        }
      ],
      templatePackages: [
        {
          filePath: "layout.js"
        }
      ]
    },
    unsetBars: jest.fn(),
    menuBar: {
      element: document.createElement("div")
    },
    appBar: {
      element: document.createElement("div")
    },
    toggleBars: jest.fn(),
    firstRendered: jest.fn(),
    toggleLegacyIframe: jest.fn()
  } as any;

  beforeEach(() => {
    router = new Router(kernel);
  });

  afterEach(() => {
    __setMatchedStoryboard(undefined);
    __setMountRoutesResults(undefined);
    jest.clearAllMocks();
  });

  it("should render matched storyboard", async () => {
    spyOnGetDllAndDepsOfStoryboard.mockReturnValueOnce({
      dll: ["d3.js"],
      deps: ["dep.js"]
    });
    spyOnGetTemplateDepsOfStoryboard.mockReturnValueOnce(["layout.js"]);
    __setMatchedStoryboard({
      routes: [],
      app: {
        id: "hello"
      }
    });
    __setMountRoutesResults({
      main: [
        {
          type: "p"
        }
      ],
      menuBar: {
        title: "menu"
      },
      appBar: {
        title: "app"
      }
    } as any);
    await router.bootstrap();
    expect(spyOnHistoryListen).toBeCalled();
    expect(spyOnLoadScript.mock.calls[0][0]).toEqual(["layout.js"]);
    expect(spyOnLoadScript.mock.calls[1][0]).toEqual(["d3.js"]);
    expect(spyOnLoadScript.mock.calls[2][0]).toEqual(["dep.js"]);
    const dispatchedEvent = spyOnDispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(dispatchedEvent.type).toBe("app.change");
    expect(dispatchedEvent.detail).toEqual({
      previousApp: undefined,
      currentApp: {
        id: "hello"
      }
    });
    expect(spyOnMountTree.mock.calls[0][0]).toEqual([{ type: "p" }]);
    expect(spyOnMountStaticNode.mock.calls[0][0]).toBe(kernel.menuBar.element);
    expect(spyOnMountStaticNode.mock.calls[0][1]).toEqual({ title: "menu" });
    expect(spyOnMountStaticNode.mock.calls[1][0]).toBe(kernel.appBar.element);
    expect(spyOnMountStaticNode.mock.calls[1][1]).toEqual({ title: "app" });
    expect(kernel.toggleBars).not.toBeCalled();
    expect(kernel.firstRendered).toBeCalled();
  });

  it("should render matched storyboard with dependsAll and redirect", async () => {
    spyOnGetDllAndDepsOfStoryboard.mockReturnValueOnce({
      dll: [],
      deps: []
    });
    spyOnGetTemplateDepsOfStoryboard.mockReturnValueOnce([]);
    __setMatchedStoryboard({
      dependsAll: true,
      routes: []
    });
    __setMountRoutesResults({
      redirect: {
        path: "/auth/login",
        state: {
          from: "/private"
        }
      }
    } as any);
    await router.bootstrap();
    expect(spyOnLoadScript.mock.calls[0][0]).toEqual([
      "dll-of-d3.js?fake-hash"
    ]);
    expect(spyOnLoadScript.mock.calls[1][0]).toEqual(["all.js", "layout.js"]);
    expect(spyOnHistoryReplace.mock.calls[0]).toEqual([
      "/auth/login",
      {
        from: "/private"
      }
    ]);
    expect(spyOnMountStaticNode).not.toBeCalled();
    expect(spyOnMountTree).not.toBeCalled();
  });

  it("should render matched storyboard with bars hidden and empty main", async () => {
    __setMatchedStoryboard({
      depsProcessed: true,
      routes: []
    });
    __setMountRoutesResults({
      barsHidden: true,
      main: []
    } as any);
    await router.bootstrap();
    expect(kernel.toggleBars).toBeCalledWith(false);
    expect(spyOnMountStaticNode).not.toBeCalled();
    expect(spyOnMountTree).toBeCalledTimes(1);
    expect(spyOnMountTree.mock.calls[0][0]).toMatchObject([
      {
        type: "basic-bricks.page-not-found",
        properties: {
          url: "/oops"
        }
      }
    ]);
  });

  it("should handle when page not found", async () => {
    await router.bootstrap();
    expect(spyOnMountTree).toBeCalledTimes(1);
    expect(spyOnMountTree.mock.calls[0][0]).toMatchObject([
      {
        type: "basic-bricks.page-not-found",
        properties: {
          url: "/oops"
        }
      }
    ]);
  });
});
