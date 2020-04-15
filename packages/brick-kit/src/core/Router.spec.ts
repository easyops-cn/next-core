import { getHistory } from "../history";
import { Router } from "./Router";
import { Kernel } from "./Kernel";
import {
  // @ts-ignore
  __setMatchedStoryboard,
  // @ts-ignore
  __setMountRoutesResults,
} from "./LocationContext";
import { mountTree, mountStaticNode } from "./reconciler";

jest.mock("../history");
jest.mock("./LocationContext");
jest.mock("./reconciler");

const spyOnGetHistory = getHistory as jest.Mock;
const spyOnMountTree = mountTree as jest.Mock;
const spyOnMountStaticNode = mountStaticNode as jest.Mock;
const spyOnDispatchEvent = jest.spyOn(window, "dispatchEvent");

let historyListeners: Function[] = [];
const mockHistoryPush = (location: any): void => {
  historyListeners.forEach((fn) => {
    fn(location, "PUSH");
  });
};
const mockHistoryPop = (location: any): void => {
  historyListeners.forEach((fn) => {
    fn(location, "POP");
  });
};
const spyOnHistoryListen = jest.fn((fn: Function) => {
  historyListeners.push(fn);
});
const spyOnHistoryReplace = jest.fn();
spyOnGetHistory.mockReturnValue({
  location: {},
  listen: spyOnHistoryListen,
  replace: spyOnHistoryReplace,
  createHref: () => "/oops",
});

const mockFeature = jest.fn().mockReturnValue({});

describe("Router", () => {
  let router: Router;
  const kernel: Kernel = {
    mountPoints: {
      main: document.createElement("div"),
      bg: document.createElement("div"),
    },
    bootstrapData: {
      storyboards: [],
    },
    unsetBars: jest.fn(),
    menuBar: {
      element: document.createElement("div"),
    },
    appBar: {
      element: document.createElement("div"),
    },
    getFeatureFlags: mockFeature,
    toggleBars: jest.fn(),
    firstRendered: jest.fn(),
    toggleLegacyIframe: jest.fn(),
    updateWorkspaceStack: jest.fn(),
    getPreviousWorkspace: jest.fn(),
    getRecentApps: jest.fn(),
    loadDepsOfStoryboard: jest.fn(),
  } as any;

  beforeEach(() => {
    router = new Router(kernel);
  });

  afterEach(() => {
    historyListeners = [];
    __setMatchedStoryboard(undefined);
    __setMountRoutesResults(undefined);
    jest.clearAllMocks();
  });

  it("should render matched storyboard", async () => {
    __setMatchedStoryboard({
      routes: [],
      app: {
        id: "hello",
      },
    });
    __setMountRoutesResults({
      main: [
        {
          type: "p",
        },
      ],
      menuBar: {
        title: "menu",
      },
      appBar: {
        title: "app",
      },
    } as any);
    expect(router.getState()).toBe("initial");
    await router.bootstrap();
    expect(router.getState()).toBe("mounted");
    expect(spyOnHistoryListen).toBeCalled();
    const dispatchedEvent = spyOnDispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(dispatchedEvent.type).toBe("app.change");
    expect(spyOnMountTree.mock.calls[0][0]).toEqual([{ type: "p" }]);
    expect(spyOnMountStaticNode.mock.calls[0][0]).toBe(kernel.menuBar.element);
    expect(spyOnMountStaticNode.mock.calls[0][1]).toEqual({ title: "menu" });
    expect(spyOnMountStaticNode.mock.calls[1][0]).toBe(kernel.appBar.element);
    expect(spyOnMountStaticNode.mock.calls[1][1]).toEqual({ title: "app" });
    expect(kernel.toggleBars).not.toBeCalled();
    expect(kernel.firstRendered).toBeCalled();
    expect(kernel.loadDepsOfStoryboard).toBeCalled();
  });

  it("should render matched storyboard with dependsAll and redirect", async () => {
    __setMatchedStoryboard({
      dependsAll: true,
      routes: [],
    });
    __setMountRoutesResults({
      flags: {
        redirect: {
          path: "/auth/login",
          state: {
            from: "/private",
          },
        },
      },
    } as any);
    await router.bootstrap();
    expect(spyOnHistoryReplace.mock.calls[0]).toEqual([
      "/auth/login",
      {
        from: "/private",
      },
    ]);
    expect(spyOnMountStaticNode).not.toBeCalled();
    expect(spyOnMountTree).not.toBeCalled();
  });

  it("should render matched storyboard with bars hidden and empty main", async () => {
    __setMatchedStoryboard({
      routes: [],
    });
    __setMountRoutesResults({
      flags: {
        barsHidden: true,
      },
      main: [],
    } as any);
    await router.bootstrap();
    expect(kernel.toggleBars).toBeCalledWith(false);
    expect(spyOnMountStaticNode).not.toBeCalled();
    expect(spyOnMountTree).toBeCalledTimes(1);
    expect(spyOnMountTree.mock.calls[0][0]).toMatchObject([
      {
        type: "basic-bricks.page-not-found",
        properties: {
          url: "/oops",
        },
      },
    ]);
  });

  it("should handle when page not found", async () => {
    await router.bootstrap();
    expect(spyOnMountTree).toBeCalledTimes(1);
    expect(spyOnMountTree.mock.calls[0][0]).toMatchObject([
      {
        type: "basic-bricks.page-not-found",
        properties: {
          url: "/oops",
        },
      },
    ]);
  });

  it("should ignore rendering if notify is false", async () => {
    await router.bootstrap();
    jest.clearAllMocks();
    mockHistoryPush({
      pathname: "/first",
    });
    await (global as any).flushPromises();
    expect(spyOnMountTree).toBeCalledTimes(1);
    mockHistoryPush({
      pathname: "/second",
      state: {
        notify: false,
      },
    });
    await (global as any).flushPromises();
    expect(spyOnMountTree).toBeCalledTimes(1);
  });

  it("should ignore rendering if location not changed except hash, state and key", async () => {
    await router.bootstrap();
    jest.clearAllMocks();
    mockHistoryPush({
      pathname: "/first",
      search: "?ok=1",
      key: "123",
      state: {
        from: "earth",
      },
    });
    await (global as any).flushPromises();
    expect(spyOnMountTree).toBeCalledTimes(1);
    mockHistoryPush({
      pathname: "/first",
      search: "?ok=1",
      hash: "#good",
    });
    await (global as any).flushPromises();
    expect(spyOnMountTree).toBeCalledTimes(1);
  });

  it("should ignore rendering if in situation of goBack after pushAnchor", async () => {
    await router.bootstrap();
    jest.clearAllMocks();
    mockHistoryPush({
      pathname: "/first",
      search: "?ok=1",
      key: "123",
      hash: "#yes",
      state: {
        notify: false,
      },
    });
    await (global as any).flushPromises();
    expect(spyOnMountTree).toBeCalledTimes(0);
    mockHistoryPop({
      pathname: "/first",
      search: "?ok=1",
      hash: null,
      key: "456",
    });
    await (global as any).flushPromises();
    expect(spyOnMountTree).toBeCalledTimes(0);
  });

  it("should render in queue", async () => {
    await router.bootstrap();
    jest.clearAllMocks();
    mockHistoryPush({
      pathname: "/first",
    });
    // `/second` should be ignored and replaced by `/third`.
    mockHistoryPush({
      pathname: "/second",
    });
    mockHistoryPush({
      pathname: "/third",
    });
    await (global as any).flushPromises();
    expect(spyOnMountTree).toBeCalledTimes(2);
  });

  it("location change should notify", async () => {
    const mockImage = jest.spyOn(window, "Image");
    mockFeature.mockReturnValue({ "log-location-change": true });
    router = new Router(kernel);
    await router.bootstrap();
    jest.clearAllMocks();
    mockHistoryPush({
      pathname: "/first",
    });
    expect(mockImage).toBeCalled();
  });
});
