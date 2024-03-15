import "whatwg-fetch";
import { apiAnalyzer, userAnalytics } from "@next-core/easyops-analytics";
import {
  mapCustomApisToNameAndNamespace,
  scanStoryboard,
} from "@next-core/brick-utils";
import { HttpAbortError, HttpResponseError } from "@next-core/brick-http";
import { History, Location, LocationListener } from "history";
import { getHistory } from "../history";
import { Router } from "./Router";
import { Kernel } from "./Kernel";
import {
  // @ts-ignore mocking
  __setMatchedStoryboard,
  // @ts-ignore mocking
  __setMountRoutesResults,
} from "./LocationContext";
import { mountTree, mountStaticNode } from "./reconciler";
import { getAuth, isLoggedIn } from "../auth";
import { getRuntime } from "../runtime";
import { preCheckPermissions } from "../internal/checkPermissions";
import {
  getStandaloneInstalledApps,
  preFetchStandaloneInstalledApps,
} from "../internal/getStandaloneInstalledApps";
import { mediaEventTarget } from "../internal/mediaQuery";
import i18next from "i18next";

jest.mock("../history");
jest.mock("./LocationContext");
jest.mock("./reconciler");
jest.mock("../auth");
jest.mock("../themeAndMode");
jest.mock("../runtime");
jest.mock("../internal/checkPermissions");
jest.mock("../internal/getStandaloneInstalledApps", () => ({
  getStandaloneInstalledApps: jest.fn().mockReturnValue([]),
  preFetchStandaloneInstalledApps: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@next-core/easyops-analytics", () => ({
  apiAnalyzer: {
    create: () => jest.mock,
    getInstance: () => ({
      tracePage: jest.fn,
    }),
  },
  userAnalytics: {
    event: jest.fn(),
  },
}));
jest.mock("@next-core/brick-utils");
jest.spyOn(i18next, "t").mockImplementation((k) => k as string);

const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => void 0);
const spyOnScanStoryboard = scanStoryboard as jest.Mock;
spyOnScanStoryboard.mockReturnValue({
  bricks: [],
  customApis: ["easyops.custom_api@myAwesomeApi"],
});
const spyOnMapCustomApisToNameAndNamespace =
  mapCustomApisToNameAndNamespace as jest.Mock;
spyOnMapCustomApisToNameAndNamespace.mockReturnValue([
  {
    name: "myAwesomeApi",
    namespace: "easyops.custom_api",
  },
]);
const spyOnGetHistory = getHistory as jest.Mock;
const spyOnMountTree = mountTree as jest.Mock;
const spyOnMountStaticNode = mountStaticNode as jest.Mock;
const spyOnDispatchEvent = jest.spyOn(window, "dispatchEvent");
const spyOnIsLoggedIn = (isLoggedIn as jest.Mock).mockReturnValue(true);
(getAuth as jest.Mock).mockReturnValue({ license: { validDaysLeft: 15 } });
const spyOnMediaEventTargetAddEventListener = jest.spyOn(
  mediaEventTarget,
  "addEventListener"
);
const mockUserAnalyticsEvent = userAnalytics.event as jest.Mock;

(getRuntime as jest.Mock).mockImplementation(() => ({
  getFeatureFlags: () => ({
    "enable-analyzer": false,
    "support-ui-8.2-compact-layout": true,
  }),
  getMiscSettings: () => ({
    noAuthGuardLoginPath: "",
  }),
  getBrickPackages: () => ({}),
}));

let historyListeners: LocationListener[] = [];
const mockHistoryPush = (location: Partial<Location>): void => {
  historyListeners.forEach((fn) => {
    fn(location as Location, "PUSH");
  });
};
const mockHistoryPop = (location: Partial<Location>): void => {
  historyListeners.forEach((fn) => {
    fn(location as Location, "POP");
  });
};

let blockMessage: string;
const setBlockMessage = jest.fn((message: string): void => {
  blockMessage = message;
});
const getBlockMessage = jest.fn((): string => {
  return blockMessage;
});
const unblock = jest.fn((): void => {
  blockMessage = undefined;
});

let blockFn: History.TransitionPromptHook;

const spyOnHistory = {
  location: {
    pathname: "/yo",
  } as unknown as Location,
  listen: jest.fn((fn: LocationListener) => {
    historyListeners.push(fn);
    return () => {
      const index = historyListeners.indexOf(fn);
      if (index >= 0) {
        historyListeners.splice(index, 1);
      }
    };
  }),
  replace: jest.fn(),
  block: jest.fn((fn) => {
    blockFn = fn;
  }),
  createHref: () => "/oops",
  setBlockMessage,
  getBlockMessage,
  unblock,
};
spyOnGetHistory.mockReturnValue(spyOnHistory);

const mockFeature = jest.fn().mockReturnValue({
  "prefetch-scripts": true,
});

describe("Router", () => {
  let router: Router;
  const kernel = {
    mountPoints: {
      main: document.createElement("div"),
      bg: document.createElement("div"),
      portal: document.createElement("div"),
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
    getRecentApps: jest.fn(),
    loadDepsOfStoryboard: jest.fn(() => Promise.resolve({ pendingTask: null })),
    registerCustomTemplatesInStoryboard: jest.fn(),
    fulfilStoryboard: jest.fn(),
    loadMicroAppApiOrchestrationAsync: jest.fn(),
    prefetchDepsOfStoryboard: jest.fn(),
    loadDynamicBricks: jest.fn(),
    layoutBootstrap: jest.fn(),
    getOriginFaviconHref: jest.fn(),
    presetBricks: {
      pageNotFound: "presentational-bricks.brick-result",
      pageError: "presentational-bricks.brick-result",
    },
    currentLayout: "console",
  } as unknown as Kernel;

  beforeEach(() => {
    router = new Router(kernel);
    apiAnalyzer.create({ api: "fake-api" });
  });

  afterEach(() => {
    historyListeners = [];
    __setMatchedStoryboard(undefined);
    __setMountRoutesResults(undefined);
    jest.clearAllMocks();
  });

  it("should render matched storyboard", async () => {
    const analyticsData = {
      prop1: "value",
    };
    __setMatchedStoryboard({
      routes: [],
      app: {
        id: "hello",
      },
    });
    __setMountRoutesResults(
      {
        route: {
          alias: "route alias",
        },
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
        analyticsData,
      },
      null
    );
    expect(router.getState()).toBe("initial");
    await router.bootstrap();
    expect(router.getState()).toBe("mounted");
    expect(spyOnHistory.listen).toBeCalled();
    const dispatchedHttpEvent = spyOnDispatchEvent.mock
      .calls[0][0] as CustomEvent;
    expect(dispatchedHttpEvent.type).toBe("http:cache.start");
    const dispatchedEvent = spyOnDispatchEvent.mock.calls[1][0] as CustomEvent;
    expect(dispatchedEvent.type).toBe("app.change");
    expect(spyOnMountTree.mock.calls[0][0]).toEqual([{ type: "p" }]);
    expect(spyOnMountStaticNode.mock.calls[0][0]).toBe(kernel.menuBar.element);
    expect(spyOnMountStaticNode.mock.calls[0][1]).toEqual({
      title: "menu",
      subMenu: null,
    });
    expect(spyOnMountStaticNode.mock.calls[1][0]).toBe(kernel.appBar.element);
    expect(spyOnMountStaticNode.mock.calls[1][1]).toEqual({ title: "app" });
    expect(kernel.toggleBars).not.toBeCalled();
    expect(kernel.firstRendered).toBeCalled();
    expect(kernel.loadDepsOfStoryboard).toBeCalled();
    expect(kernel.registerCustomTemplatesInStoryboard).toBeCalled();
    expect(kernel.fulfilStoryboard).toBeCalled();
    expect(kernel.loadMicroAppApiOrchestrationAsync).toBeCalled();
    expect(kernel.prefetchDepsOfStoryboard).not.toBeCalled();
    expect(preCheckPermissions).toBeCalled();
    expect(preFetchStandaloneInstalledApps).not.toBeCalled();
    expect(getStandaloneInstalledApps).not.toBeCalled();
    expect(spyOnMediaEventTargetAddEventListener).toBeCalled();
    expect(mockUserAnalyticsEvent).toBeCalledWith("page_view", {
      micro_app_id: "hello",
      route_alias: "route alias",
      ...analyticsData,
    });
    jest.advanceTimersByTime(0);
    expect(kernel.prefetchDepsOfStoryboard).toBeCalled();
  });

  it("should render matched storyboard in standalone mode", async () => {
    window.STANDALONE_MICRO_APPS = true;
    window.NO_AUTH_GUARD = false;
    const analyticsData = {
      prop1: "value",
    };
    __setMatchedStoryboard({
      routes: [],
      app: {
        id: "hello-standalone",
      },
    });
    __setMountRoutesResults(
      {
        route: {
          alias: "route alias",
        },
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
        analyticsData,
      },
      null
    );
    expect(router.getState()).toBe("initial");
    await router.bootstrap();
    expect(router.getState()).toBe("mounted");
    expect(spyOnHistory.listen).toBeCalled();
    const dispatchedHttpEvent = spyOnDispatchEvent.mock
      .calls[0][0] as CustomEvent;
    expect(dispatchedHttpEvent.type).toBe("http:cache.start");
    const dispatchedEvent = spyOnDispatchEvent.mock.calls[1][0] as CustomEvent;
    expect(dispatchedEvent.type).toBe("app.change");
    expect(spyOnMountTree.mock.calls[0][0]).toEqual([{ type: "p" }]);
    expect(spyOnMountStaticNode.mock.calls[0][0]).toBe(kernel.menuBar.element);
    expect(spyOnMountStaticNode.mock.calls[0][1]).toEqual({
      title: "menu",
      subMenu: null,
    });
    expect(spyOnMountStaticNode.mock.calls[1][0]).toBe(kernel.appBar.element);
    expect(spyOnMountStaticNode.mock.calls[1][1]).toEqual({ title: "app" });
    expect(kernel.toggleBars).not.toBeCalled();
    expect(kernel.firstRendered).toBeCalled();
    expect(kernel.loadDepsOfStoryboard).toBeCalled();
    expect(kernel.registerCustomTemplatesInStoryboard).toBeCalled();
    expect(kernel.fulfilStoryboard).toBeCalled();
    expect(kernel.loadMicroAppApiOrchestrationAsync).toBeCalled();
    expect(kernel.prefetchDepsOfStoryboard).not.toBeCalled();
    expect(preCheckPermissions).toBeCalled();
    expect(preFetchStandaloneInstalledApps).toBeCalled();
    expect(getStandaloneInstalledApps).toBeCalled();
    expect(spyOnMediaEventTargetAddEventListener).toBeCalled();
    expect(mockUserAnalyticsEvent).toBeCalledWith("page_view", {
      micro_app_id: "hello-standalone",
      route_alias: "route alias",
      ...analyticsData,
    });
    jest.advanceTimersByTime(0);
    expect(kernel.prefetchDepsOfStoryboard).toBeCalled();
  });

  it("should redirect to login page if not logged in.", async () => {
    __setMatchedStoryboard({
      app: {
        id: "hello",
      },
      dependsAll: true,
      routes: [],
    });
    __setMountRoutesResults(
      null,
      new HttpResponseError(new Response("", { status: 401 }), {
        code: 100003,
      })
    );
    await router.bootstrap();
    expect(spyOnHistory.replace.mock.calls[0]).toEqual([
      "/auth/login",
      {
        from: {
          pathname: "/yo",
        },
      },
    ]);
    expect(mockConsoleError).toBeCalled();
  });

  it("should ignore http abort error", async () => {
    __setMatchedStoryboard({
      app: {
        id: "hello",
      },
      dependsAll: true,
      routes: [],
    });
    __setMountRoutesResults(
      null,
      new HttpAbortError("The user aborted a request.")
    );
    await router.bootstrap();
    expect(spyOnHistory.replace).not.toBeCalled();
    expect(mockConsoleError).toBeCalledTimes(1);
    expect(spyOnMountTree).toBeCalledTimes(0);
  });

  it("should show page error.", async () => {
    __setMatchedStoryboard({
      app: {
        id: "hello",
      },
      routes: [],
    });
    __setMountRoutesResults(null, new Error("oops"));
    await router.bootstrap();
    expect(spyOnHistory.replace).not.toBeCalled();
    expect(kernel.layoutBootstrap).toBeCalledWith("console");
    expect(kernel.loadDynamicBricks).toBeCalledWith([
      "presentational-bricks.brick-result",
    ]);
    expect(spyOnMountTree).toBeCalledTimes(1);
    expect(spyOnMountTree.mock.calls[0][0]).toMatchObject([
      {
        type: "presentational-bricks.brick-result",
        properties: {
          customTitle: "brick-kit:OTHER_ERROR",
          illustrationsConfig: {
            category: "easyops2",
            name: "unknown-error",
          },
          status: "illustrations",
          style: {
            alignItems: "center",
            display: "flex",
            height: "calc(100vh - var(--app-bar-height))",
            justifyContent: "center",
            transform: "translateY(-100px)",
          },
          subTitle: "Error: oops",
          useNewIllustration: true,
        },
      },
    ]);

    __setMountRoutesResults(
      null,
      new HttpResponseError(
        new Response("", { statusText: "oops", status: 403 })
      )
    );
    await router.bootstrap();
    expect(spyOnMountTree).toBeCalledTimes(2);
    expect(spyOnMountTree.mock.calls[1][0]).toMatchObject([
      {
        type: "presentational-bricks.brick-result",
        properties: {
          customTitle: "brick-kit:NO_PERMISSION",
          illustrationsConfig: {
            category: "easyops2",
            name: "no-permission",
          },
          status: "illustrations",
          subTitle: "HttpResponseError: oops",
          useNewIllustration: true,
          style: {
            alignItems: "center",
            display: "flex",
            height: "calc(100vh - var(--app-bar-height))",
            justifyContent: "center",
            transform: "translateY(-100px)",
          },
        },
      },
    ]);
  });

  it("should redirect to login page if redirect exists.", async () => {
    __setMatchedStoryboard({
      app: {
        id: "hello",
      },
      dependsAll: true,
      routes: [],
    });
    __setMountRoutesResults(
      {
        flags: {
          unauthenticated: true,
          redirect: {
            path: "/auth/login",
            state: {
              from: "/private",
            },
          },
        },
      },
      null
    );
    await router.bootstrap();
    expect(spyOnHistory.replace.mock.calls[0]).toEqual([
      "/auth/login",
      {
        from: {
          pathname: "/yo",
        },
      },
    ]);
  });

  it("should render matched storyboard with dependsAll and redirect", async () => {
    __setMatchedStoryboard({
      app: {
        id: "hello",
      },
      dependsAll: true,
      routes: [],
    });
    __setMountRoutesResults(
      {
        flags: {
          redirect: {
            path: "/auth/login",
            state: {
              from: "/private",
            },
          },
        },
      },
      null
    );
    await router.bootstrap();
    expect(spyOnHistory.replace.mock.calls[0]).toEqual([
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
      app: {
        id: "hello",
      },
      routes: [],
    });
    __setMountRoutesResults(
      {
        flags: {
          barsHidden: true,
        },
        main: [],
      },
      null
    );
    await router.bootstrap();
    expect(kernel.loadDynamicBricks).toBeCalledWith([
      "presentational-bricks.brick-result",
    ]);
    expect(kernel.toggleBars).toBeCalledWith(false);
    expect(spyOnMountStaticNode).not.toBeCalled();
    expect(spyOnMountTree).toBeCalledTimes(1);
    expect(spyOnMountTree.mock.calls[0][0]).toMatchObject([
      {
        type: "presentational-bricks.brick-result",
        properties: {
          illustrationsConfig: {
            name: "http-404",
            category: "exception",
          },
          customTitle: "brick-kit:PAGE_NOT_FOUND",
          status: "illustrations",
          useNewIllustration: true,
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "translateY(-100px)",
            height: "calc(100vh - var(--app-bar-height))",
          },
        },
      },
    ]);
  });

  it("should handle when page not found", async () => {
    await router.bootstrap();
    expect(kernel.loadDynamicBricks).toBeCalledWith([
      "presentational-bricks.brick-result",
    ]);
    expect(spyOnMountTree).toBeCalledTimes(1);
    expect(spyOnMountTree.mock.calls[0][0]).toMatchObject([
      {
        type: "presentational-bricks.brick-result",
        properties: {
          illustrationsConfig: {
            name: "no-permission",
            category: "easyops2",
          },
          customTitle: "brick-kit:APP_NOT_FOUND",
          status: "illustrations",
          useNewIllustration: true,
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "translateY(-100px)",
            height: "calc(100vh - var(--app-bar-height))",
          },
        },
      },
    ]);
  });

  it("should handle when page found is an abstract route", async () => {
    __setMatchedStoryboard({
      routes: [],
      app: {
        id: "hello",
      },
    });
    __setMountRoutesResults(
      {
        route: {
          type: "routes",
        },
        main: [
          {
            type: "p",
          },
        ],
      },
      null
    );
    await router.bootstrap();
    expect(kernel.loadDynamicBricks).toBeCalledWith([
      "presentational-bricks.brick-result",
    ]);
    expect(spyOnMountTree).toBeCalledTimes(1);
    expect(spyOnMountTree.mock.calls[0][0]).toMatchObject([
      {
        type: "presentational-bricks.brick-result",
        properties: {
          illustrationsConfig: {
            name: "http-404",
            category: "exception",
          },
          customTitle: "brick-kit:PAGE_NOT_FOUND",
          status: "illustrations",
          useNewIllustration: true,
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "translateY(-100px)",
            height: "calc(100vh - var(--app-bar-height))",
          },
        },
      },
    ]);
  });

  it("should redirect to login when page not found and not logged in", async () => {
    spyOnIsLoggedIn.mockReturnValueOnce(false);
    await router.bootstrap();
    expect(kernel.loadMicroAppApiOrchestrationAsync).not.toBeCalled();
    expect(spyOnMountTree).toBeCalledTimes(0);
    expect(spyOnHistory.replace).toBeCalledWith("/auth/login", {
      from: {
        pathname: "/yo",
      },
    });
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

  it("should notify when location changed", async () => {
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

  it("should block", async () => {
    router = new Router(kernel);
    jest.clearAllMocks();

    const fireBeforeunload = (): CustomEvent => {
      const beforeunloadEvent = new CustomEvent("beforeunload");
      jest.spyOn(beforeunloadEvent, "preventDefault");
      window.dispatchEvent(beforeunloadEvent);
      return beforeunloadEvent;
    };

    const eventTriggeringNothing = fireBeforeunload();
    expect(eventTriggeringNothing.preventDefault).not.toBeCalled();

    jest.clearAllMocks();
    spyOnHistory.setBlockMessage("Are you sure to leave?");
    const eventBlocking = fireBeforeunload();
    expect(eventBlocking.preventDefault).toBeCalled();
    expect(spyOnHistory.unblock).not.toBeCalled();

    spyOnHistory.unblock();
    jest.clearAllMocks();
    const messageUnblocked = blockFn(
      {
        pathname: "/home",
      } as Location,
      "PUSH"
    );
    expect(messageUnblocked).toBe(undefined);

    jest.clearAllMocks();
    spyOnHistory.setBlockMessage("Are you sure to leave?");
    const messageBlocked = blockFn(
      {
        pathname: "/home",
      } as Location,
      "PUSH"
    );
    expect(messageBlocked).toBe("Are you sure to leave?");
  });
  it("should work width layoutBootstrap", async () => {
    __setMatchedStoryboard({
      app: {
        id: "hello",
        layoutType: "business",
      },
      routes: [
        {
          alias: "page1",
          bricks: [
            {
              bg: false,
              brick: "base-layout.tpl-base-page-module",
              iid: "5e111eff838cb",
              injectDeep: true,
              portal: false,
              properties: {
                dataset: {
                  testid: "tpl-base-page-module",
                },
              },
              slots: {
                content: {
                  bricks: [
                    {
                      brick: "basic-bricks.micro-view",
                      iid: "5e111f3c46f81",
                      injectDeep: true,
                      portal: false,
                      properties: {
                        pageTitle: "hello world",
                      },
                    },
                  ],
                  type: "bricks",
                },
              },
            },
          ],
        },
      ],
    });
    __setMountRoutesResults(null, new Error("oops"));
    spyOnScanStoryboard.mockReturnValue({
      bricks: ["base-layout.tpl-base-page-module", "basic-bricks.micro-view"],
      customApis: ["easyops.custom_api@myAwesomeApi"],
    });
    await router.bootstrap();
    expect(spyOnHistory.replace).not.toBeCalled();
    expect(kernel.layoutBootstrap).toBeCalledWith("console");
    mockFeature.mockReturnValue({ "support-ui-8.0-base-layout": true });
    router = new Router(kernel);
    await router.bootstrap();
    expect(kernel.layoutBootstrap).toBeCalledWith("business");
  });

  it("should render support-ui-8.2-compact-layout", async () => {
    router = new Router(kernel);
    await router.bootstrap();
    expect(document.body.className).toContain("compact-layout");
  });
  it("should redirect to other login page  if not logged in", async () => {
    window.STANDALONE_MICRO_APPS = true;
    window.NO_AUTH_GUARD = true;
    (getRuntime as jest.Mock).mockImplementation(() => ({
      getFeatureFlags: () => ({
        "enable-analyzer": false,
        "support-ui-8.2-compact-layout": true,
      }),
      getMiscSettings: () => ({
        noAuthGuardLoginPath: "/easy-core-console/login",
      }),
      getBrickPackages: () => ({}),
    }));
    __setMatchedStoryboard({
      app: {
        id: "hello",
      },
      dependsAll: true,
      routes: [],
    });
    __setMountRoutesResults(
      null,
      new HttpResponseError(new Response("", { status: 401 }), {
        code: 100003,
      })
    );
    await router.bootstrap();
    expect(spyOnHistory.replace.mock.calls[0]).toEqual([
      "/easy-core-console/login",
    ]);
  });
});
