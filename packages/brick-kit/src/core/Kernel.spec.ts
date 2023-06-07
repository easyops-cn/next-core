import i18next from "i18next";
import {
  loadScript,
  prefetchScript,
  getDllAndDepsOfStoryboard,
  getDllAndDepsByResource,
  getTemplateDepsOfStoryboard,
  scanBricksInBrickConf,
  deepFreeze,
} from "@next-core/brick-utils";
import { checkLogin } from "@next-sdk/auth-sdk";
import {
  BootstrapV2Api_bootstrapV2,
  BootstrapV2Api_getAppStoryboardV2,
} from "@next-sdk/api-gateway-sdk";
import { UserAdminApi_searchAllUsersInfo } from "@next-sdk/user-service-sdk";
import {
  InstalledMicroAppApi_getI18NData,
  InstalledMicroAppApi_getMenusInfo,
} from "@next-sdk/micro-app-sdk";
import { InstanceApi_postSearch } from "@next-sdk/cmdb-sdk";
import {
  LayoutType,
  MountPoints,
  RuntimeBootstrapData,
  Storyboard,
} from "@next-core/brick-types";
import { Kernel } from "./Kernel";
import { authenticate, isLoggedIn } from "../auth";
import { MenuBar, AppBar, BaseBar } from "./Bars";
import { Router } from "./Router";
import { registerCustomTemplate } from "./CustomTemplates";
import * as mockHistory from "../history";
import { CUSTOM_API_PROVIDER } from "../providers/CustomApi";
import { loadLazyBricks, loadAllLazyBricks } from "./LazyBrickRegistry";
import { getRuntime } from "../runtime";
import { initAnalytics } from "./initAnalytics";
import {
  standaloneBootstrap,
  safeGetRuntimeMicroAppStandalone,
} from "./standaloneBootstrap";
import { applyColorTheme } from "../internal/applyColorTheme";
import { formRenderer } from "./CustomForms/constants";
import { loadBricksImperatively } from "@next-core/loader";

i18next.init({
  fallbackLng: "en",
});

jest.mock("@next-core/brick-utils");
jest.mock("@next-core/loader");
jest.mock("@next-sdk/auth-sdk");
jest.mock("@next-sdk/user-service-sdk");
jest.mock("@next-sdk/api-gateway-sdk");
jest.mock("@next-sdk/micro-app-standalone-sdk");
jest.mock("@next-sdk/micro-app-sdk");
jest.mock("@next-sdk/cmdb-sdk");
jest.mock("./Bars");
jest.mock("./Router");
jest.mock("./CustomTemplates");
jest.mock("./LazyBrickRegistry");
jest.mock("../auth");
jest.mock("../runtime");
jest.mock("./initAnalytics");
jest.mock("./standaloneBootstrap");
jest.mock("../internal/applyColorTheme");

const historyPush = jest.fn();
jest.spyOn(mockHistory, "getHistory").mockReturnValue({
  push: historyPush,
  location: {
    pathname: "/from",
  },
} as any);

const spyOnCheckLogin = checkLogin as jest.Mock;
const spyOnBootstrap = BootstrapV2Api_bootstrapV2 as jest.Mock;
const spyOnGetAppStoryboard = (
  BootstrapV2Api_getAppStoryboardV2 as jest.Mock
).mockResolvedValue({
  routes: [],
  app: {
    id: "fake",
  },
  meta: {
    i18n: {
      en: {
        HELLO: "Hello",
      },
    },
  },
});
const mockSafeGetRuntimeMicroAppStandalone =
  safeGetRuntimeMicroAppStandalone as jest.Mock;
const spyOnAuthenticate = authenticate as jest.Mock;
const spyOnIsLoggedIn = isLoggedIn as jest.Mock;
const spyApplyColorTheme = applyColorTheme as jest.Mock;
const spyOnRouter = Router as jest.Mock;
const searchAllUsersInfo = UserAdminApi_searchAllUsersInfo as jest.Mock;
const searchAllMagicBrickConfig = InstanceApi_postSearch as jest.Mock;
const getI18NData = InstalledMicroAppApi_getI18NData as jest.Mock;

const spyOnLoadScript = loadScript as jest.Mock;
const spyOnGetDllAndDepsOfStoryboard =
  getDllAndDepsOfStoryboard as jest.MockedFunction<
    typeof getDllAndDepsOfStoryboard
  >;
const spyOnGetDllAndDepsByResource = getDllAndDepsByResource as jest.Mock;
const spyOnGetTemplateDepsOfStoryboard =
  getTemplateDepsOfStoryboard as jest.Mock;
const spyOnScanBricksInBrickConf = scanBricksInBrickConf as jest.Mock;

const spyOnAddResourceBundle = jest.spyOn(i18next, "addResourceBundle");

const spyOnApplyPageTitle = jest.fn();
const mockInitAnalytics = initAnalytics as jest.Mock;

(getRuntime as jest.Mock).mockImplementation(() => ({
  applyPageTitle: spyOnApplyPageTitle,
}));

spyOnScanBricksInBrickConf.mockImplementation((brickConf) => [brickConf.brick]);

spyOnGetDllAndDepsByResource.mockImplementation(
  ({
    bricks,
    editorBricks,
  }: {
    bricks?: string[];
    editorBricks?: string[];
  }) => ({
    dll: [],
    deps: [
      ...(bricks?.map((brick) => brick.split(".")[0]) ?? []),
      ...(editorBricks?.map((brick) => `${brick.split(".")[0]}/editors`) ?? []),
    ],
  })
);

const mockConsoleWarn = jest
  .spyOn(console, "warn")
  .mockImplementation(() => void 0);

const mockStandaloneBootstrap = standaloneBootstrap as jest.Mock;

(deepFreeze as jest.Mock).mockImplementation((t) => Object.freeze(t));

// Mock a custom element of `my.test-provider`.
customElements.define("my.test-provider", class Tmp extends HTMLElement {});
customElements.define(
  CUSTOM_API_PROVIDER,
  class ProviderCustomApi extends HTMLElement {}
);

window.DLL_PATH = {
  d3: "dll-of-d3.123.js",
  "editor-bricks-helper": "dll-of-editor-bricks-helper.456.js",
  "react-dnd": "dll-of-react-dnd.789.js",
};

describe("Kernel", () => {
  let kernel: Kernel;

  beforeEach(() => {
    kernel = new Kernel();
    window.STANDALONE_MICRO_APPS = undefined;
    window.NO_AUTH_GUARD = undefined;
  });

  afterEach(() => {
    jest.clearAllMocks();
    spyOnGetTemplateDepsOfStoryboard.mockReset();
    spyOnGetDllAndDepsOfStoryboard.mockReset();
  });

  it("should bootstrap", async () => {
    const mountPoints: MountPoints = {
      appBar: document.createElement("div") as any,
      menuBar: document.createElement("div") as any,
      loadingBar: document.createElement("div") as any,
      main: document.createElement("div") as any,
      bg: document.createElement("div") as any,
      portal: document.createElement("div") as any,
    };
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    spyOnIsLoggedIn.mockReturnValueOnce(true);
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          routes: [],
        },
      ],
      brickPackages: [
        {
          filePath: "all.js",
        },
      ],
      templatePackages: [
        {
          filePath: "layout.js",
        },
      ],
      settings: {
        featureFlags: {
          "load-magic-brick-config": true,
        },
      },
    });
    await kernel.bootstrap(mountPoints);
    expect(searchAllUsersInfo).not.toBeCalled();
    expect(searchAllMagicBrickConfig).not.toBeCalled();
    expect(spyOnAuthenticate.mock.calls[0][0]).toEqual({
      loggedIn: true,
    });
    expect(spyOnRouter.mock.instances[0].bootstrap).toBeCalled();

    expect(kernel.getFeatureFlags()).toEqual({
      "load-magic-brick-config": true,
    });

    // `postMessage` did not trigger events.
    // window.postMessage({ type: "auth.guard" }, window.location.origin);
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: window.location.origin,
        data: {
          type: "auth.guard",
        },
      })
    );
    expect(historyPush).toBeCalledWith("/auth/login", {
      from: {
        pathname: "/from",
      },
    });

    spyOnGetDllAndDepsOfStoryboard.mockReturnValueOnce({
      dll: ["d3.js", "dll-of-editor-bricks-helper.abc.js"],
      deps: ["dep.js"],
      bricks: ["my-brick"],
      v3Bricks: ["v3.my-brick"],
      eager: {
        dll: ["ace.js"],
        deps: ["processors.js"],
        v3Bricks: ["v3-widgets.my-widget"],
      },
    });
    spyOnGetTemplateDepsOfStoryboard.mockReturnValueOnce(["layout.js"]);
    const storyboard = {
      app: {
        id: "app-a",
      },
      meta: {
        customTemplates: [
          {
            name: "tpl-a",
            proxy: {},
            bricks: [],
          },
        ],
      },
    } as Partial<Storyboard> as Storyboard;
    const { pendingTask } = await kernel.loadDepsOfStoryboard(storyboard);
    await kernel.registerCustomTemplatesInStoryboard(storyboard);
    expect(spyOnLoadScript).toBeCalledTimes(6);
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(
      1,
      ["layout.js"],
      undefined
    );
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(2, ["ace.js"], undefined);
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(
      3,
      ["processors.js"],
      undefined
    );
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(
      4,
      "dll-of-react-dnd.789.js",
      undefined
    );
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(
      5,
      ["d3.js", "dll-of-editor-bricks-helper.abc.js"],
      undefined
    );
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(6, ["dep.js"], undefined);
    expect(loadLazyBricks).toBeCalledTimes(0);
    expect(registerCustomTemplate as jest.Mock).toBeCalledWith(
      "tpl-a",
      {
        proxy: {},
        bricks: [],
      },
      "app-a",
      true
    );
    expect(loadBricksImperatively).toBeCalledTimes(1);
    expect(loadBricksImperatively).toHaveBeenNthCalledWith(
      1,
      ["v3-widgets.my-widget"],
      expect.any(Array)
    );

    await pendingTask;
    expect(loadLazyBricks).toBeCalledTimes(1);
    expect(loadLazyBricks).toBeCalledWith(["my-brick"]);
    expect(loadAllLazyBricks).not.toBeCalled();
    expect(loadBricksImperatively).toBeCalledTimes(2);
    expect(loadBricksImperatively).toHaveBeenNthCalledWith(
      2,
      ["v3.my-brick"],
      expect.any(Array)
    );

    spyOnLoadScript.mockClear();
    (loadBricksImperatively as jest.Mock).mockClear();
    (loadLazyBricks as jest.Mock).mockClear();

    spyOnGetDllAndDepsOfStoryboard.mockReturnValueOnce({
      dll: [],
      deps: [],
      bricks: [],
      eager: {
        dll: [],
        deps: [],
      },
    });
    spyOnGetTemplateDepsOfStoryboard.mockReturnValueOnce([]);
    const { pendingTask: pendingTask2 } = await kernel.loadDepsOfStoryboard({
      dependsAll: true,
    } as any);
    expect(spyOnLoadScript).toBeCalledTimes(3);
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(
      1,
      "dll-of-react-dnd.789.js",
      undefined
    );
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(
      2,
      [
        "dll-of-d3.123.js",
        "dll-of-editor-bricks-helper.456.js",
        "dll-of-react-dnd.789.js",
      ],
      undefined
    );
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(
      3,
      ["all.js", "layout.js"],
      undefined
    );
    expect(loadAllLazyBricks).toBeCalledTimes(1);

    await pendingTask2;
    expect(spyOnLoadScript).toBeCalledTimes(3);
    expect(loadLazyBricks).not.toBeCalled();

    const fakeStoryboard = {
      app: {
        id: "fake",
        menuIcon: {
          imgSrc:
            "api/gateway/object_store.object_store.GetObject/api/v1/objectStore/bucket/next-builder/object/test.jpeg",
        },
      },
    } as any;

    // Make two parallel invocations at the same time,
    // it should only fulfil once.
    await Promise.all([
      kernel.fulfilStoryboard(fakeStoryboard),
      kernel.fulfilStoryboard(fakeStoryboard),
    ]);
    expect(spyOnGetAppStoryboard).toBeCalledWith("fake", {});
    expect(spyOnAddResourceBundle).toBeCalledWith("en", "$app-fake", {
      HELLO: "Hello",
    });
    expect(fakeStoryboard.app.menuIcon.imgSrc).toEqual(
      "/micro-apps/fake/images/test.jpeg"
    );
    expect(fakeStoryboard.$$fulfilled).toBe(true);
    await kernel.fulfilStoryboard(fakeStoryboard);
    expect(spyOnGetAppStoryboard).toBeCalledTimes(1);
  });

  it("should bootstrap if not loggedIn", async () => {
    const mountPoints: MountPoints = {
      appBar: document.createElement("div") as any,
      menuBar: document.createElement("div") as any,
      loadingBar: document.createElement("div") as any,
      main: document.createElement("div") as any,
      bg: document.createElement("div") as any,
      portal: document.createElement("div") as any,
    };
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: false,
    });
    spyOnBootstrap.mockResolvedValue({
      storyboards: [
        {
          routes: [],
        },
      ],
      brickPackages: [],
    });
    await kernel.bootstrap(mountPoints);
    expect(spyOnBootstrap).toBeCalledTimes(1);
    expect(spyOnAuthenticate).not.toBeCalled();

    await kernel.reloadMicroApps();
    expect(spyOnBootstrap).toBeCalledTimes(2);
    spyOnBootstrap.mockReset();
  });

  it("should fulfil i18n", async () => {
    const mountPoints: MountPoints = {
      appBar: document.createElement("div") as any,
      menuBar: document.createElement("div") as any,
      loadingBar: document.createElement("div") as any,
      main: document.createElement("div") as any,
      bg: document.createElement("div") as any,
      portal: document.createElement("div") as any,
    };
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    const appHello: any = {
      app: {
        id: "hello",
      },
    };
    const appFake: any = {
      app: {
        id: "fake",
      },
    };
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [appHello, appFake],
    });
    await kernel.bootstrap(mountPoints);

    kernel.fulfilStoryboard(appFake);
    expect(appFake).toMatchObject({
      $$fulfilling: expect.any(Promise),
    });

    getI18NData.mockImplementationOnce(({ appIds }: { appIds: string }) =>
      Promise.resolve({
        i18nInfo: appIds
          .split(",")
          .filter(Boolean)
          .map((appId) => ({
            appId,
            i18n: {
              en: {
                WORLD: "World",
              },
            },
          })),
      })
    );
    await kernel.fulfilStoryboardI18n(["fake", "hello"]);

    // `fake` is ignored since it's already being fulfilling.
    expect(getI18NData).toBeCalledWith({ appIds: "hello" });

    expect(appHello).toMatchObject({
      $$i18nFulfilled: true,
      meta: {
        i18n: {
          en: {
            WORLD: "World",
          },
        },
      },
    });

    // It should only fulfil once.
    await kernel.fulfilStoryboardI18n(["fake", "hello"]);
    expect(getI18NData).toBeCalledTimes(1);
  });

  it("shouldn't fulfil i18n for standalone micro-apps", async () => {
    window.STANDALONE_MICRO_APPS = true;
    window.NO_AUTH_GUARD = false;
    const mountPoints: MountPoints = {
      appBar: document.createElement("div") as any,
      menuBar: document.createElement("div") as any,
      loadingBar: document.createElement("div") as any,
      main: document.createElement("div") as any,
      bg: document.createElement("div") as any,
      portal: document.createElement("div") as any,
    };
    const appHello: any = {
      app: {
        id: "hello",
      },
    };
    mockStandaloneBootstrap.mockResolvedValueOnce({
      storyboards: [appHello],
    });
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    await kernel.bootstrap(mountPoints);

    await kernel.fulfilStoryboardI18n(["hello"]);
    expect(spyOnGetAppStoryboard).not.toBeCalled();
    expect(mockSafeGetRuntimeMicroAppStandalone).not.toBeCalled();
  });

  it("should bootstrap for standalone micro-apps", async () => {
    window.STANDALONE_MICRO_APPS = true;
    window.NO_AUTH_GUARD = true;
    const mountPoints: MountPoints = {
      appBar: document.createElement("div") as any,
      menuBar: document.createElement("div") as any,
      loadingBar: document.createElement("div") as any,
      main: document.createElement("div") as any,
      bg: document.createElement("div") as any,
      portal: document.createElement("div") as any,
    };
    const appHello: any = {
      app: {
        id: "hello",
      },
    };
    mockStandaloneBootstrap.mockResolvedValueOnce({
      storyboards: [appHello],
    });
    await kernel.bootstrap(mountPoints);
    expect(spyOnCheckLogin).not.toBeCalled();
    expect(spyOnBootstrap).not.toBeCalled();
    expect(mockStandaloneBootstrap).toBeCalledTimes(1);

    await kernel.reloadMicroApps();
    expect(spyOnBootstrap).not.toBeCalled();
    expect(mockStandaloneBootstrap).toBeCalledTimes(1);

    await kernel.fulfilStoryboard(appHello);
    expect(spyOnGetAppStoryboard).not.toBeCalled();
  });

  it("should bootstrap for standalone micro-apps, without no auth guard", async () => {
    window.STANDALONE_MICRO_APPS = true;
    window.NO_AUTH_GUARD = false;
    const mountPoints: MountPoints = {
      appBar: document.createElement("div") as any,
      menuBar: document.createElement("div") as any,
      loadingBar: document.createElement("div") as any,
      main: document.createElement("div") as any,
      bg: document.createElement("div") as any,
      portal: document.createElement("div") as any,
    };
    const appHello: any = {
      app: {
        id: "hello",
        defaultConfig: { configA: { key1: "value1" } },
      },
    };
    mockStandaloneBootstrap.mockResolvedValueOnce({
      storyboards: [appHello],
    });
    mockSafeGetRuntimeMicroAppStandalone.mockResolvedValueOnce({
      injectMenus: [
        {
          menuId: "menu-1",
          title: "Menu 1",
        },
      ],
      userConfig: {
        configA: { key2: "value2" },
        configB: "valueB",
      },
    });
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    await kernel.bootstrap(mountPoints);
    expect(spyOnBootstrap).not.toBeCalled();
    expect(mockStandaloneBootstrap).toBeCalledTimes(1);

    await kernel.reloadMicroApps();
    expect(spyOnBootstrap).not.toBeCalled();
    expect(mockStandaloneBootstrap).toBeCalledTimes(1);

    await kernel.fulfilStoryboard(appHello);
    expect(spyOnGetAppStoryboard).not.toBeCalled();
    expect(mockSafeGetRuntimeMicroAppStandalone).toBeCalledTimes(1);

    expect(kernel.bootstrapData.storyboards[0].app.userConfig).toEqual({
      configA: { key2: "value2" },
      configB: "valueB",
    });
    expect(kernel.bootstrapData.storyboards[0].app.config).toEqual({
      configA: { key1: "value1", key2: "value2" },
      configB: "valueB",
    });
  });

  it("should bootstrap for standalone micro-apps, without no auth guard, get runtime failed", async () => {
    window.STANDALONE_MICRO_APPS = true;
    window.NO_AUTH_GUARD = false;
    const mountPoints: MountPoints = {
      appBar: document.createElement("div") as any,
      menuBar: document.createElement("div") as any,
      loadingBar: document.createElement("div") as any,
      main: document.createElement("div") as any,
      bg: document.createElement("div") as any,
      portal: document.createElement("div") as any,
    };
    const appHello: any = {
      app: {
        id: "hello",
      },
    };
    mockStandaloneBootstrap.mockResolvedValueOnce({
      storyboards: [appHello],
    });
    mockSafeGetRuntimeMicroAppStandalone.mockRejectedValueOnce("oops");
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    await kernel.bootstrap(mountPoints);
    expect(spyOnBootstrap).not.toBeCalled();
    expect(mockStandaloneBootstrap).toBeCalledTimes(1);

    await kernel.reloadMicroApps();
    expect(spyOnBootstrap).not.toBeCalled();
    expect(mockStandaloneBootstrap).toBeCalledTimes(1);

    await kernel.fulfilStoryboard(appHello);
    expect(spyOnGetAppStoryboard).not.toBeCalled();
    expect(mockSafeGetRuntimeMicroAppStandalone).toBeCalledTimes(1);

    expect(mockConsoleWarn).toBeCalledWith(
      "request standalone runtime api from micro-app-standalone failed: ",
      "oops",
      ", something might went wrong running standalone micro app"
    );
    expect(kernel.bootstrapData.storyboards[0].app.userConfig).toBeUndefined();
  });

  it("should firstRendered", async () => {
    expect(document.body.classList.contains("first-rendered")).toBe(false);
    kernel.firstRendered();
    await jest.runAllTimers();
    expect(document.body.classList.contains("first-rendered")).toBe(true);
  });

  it("should work for easyops layout when ui version is v5", async () => {
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    spyOnIsLoggedIn.mockReturnValueOnce(true);
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          routes: [],
        },
      ],
      brickPackages: [],
    });
    await kernel.bootstrap({} as any);
    kernel.bootstrapData = {
      navbar: {
        menuBar: "basic-bricks.menu-bar",
        appBar: "basic-bricks.app-bar",
        loadingBar: "basic-bricks.loading-bar",
      },
    } as RuntimeBootstrapData;
    kernel.menuBar = {
      bootstrap: jest.fn(),
    } as unknown as MenuBar;
    kernel.appBar = {
      bootstrap: jest.fn(),
    } as unknown as AppBar;
    kernel.loadingBar = {
      bootstrap: jest.fn(),
    } as unknown as BaseBar;
    await kernel.layoutBootstrap("console");
    expect(kernel.currentLayout).toBe("console");
    expect(kernel.presetBricks).toMatchObject({
      pageError: "presentational-bricks.brick-result",
      pageNotFound: "presentational-bricks.brick-result",
    });
    expect(document.body.classList.contains("layout-console")).toBe(true);
    expect(document.body.classList.contains("layout-business")).toBe(false);
    expect(kernel.menuBar.bootstrap).toBeCalledWith("basic-bricks.menu-bar", {
      testid: "brick-next-menu-bar",
    });
    expect(kernel.appBar.bootstrap).toBeCalledWith("basic-bricks.app-bar");
    expect(kernel.loadingBar.bootstrap).toBeCalledWith(
      "basic-bricks.loading-bar"
    );
  });

  it("should work for business layout", async () => {
    kernel.menuBar = {
      bootstrap: jest.fn(),
    } as unknown as MenuBar;
    kernel.appBar = {
      bootstrap: jest.fn(),
    } as unknown as AppBar;
    kernel.loadingBar = {
      bootstrap: jest.fn(),
    } as unknown as BaseBar;
    await kernel.layoutBootstrap("business");
    expect(kernel.currentLayout).toBe("business");
    expect(kernel.presetBricks).toMatchObject({
      pageError: "presentational-bricks.brick-result",
      pageNotFound: "presentational-bricks.brick-result",
    });
    expect(document.body.classList.contains("layout-business")).toBe(true);
    expect(document.body.classList.contains("layout-console")).toBe(false);
    expect(kernel.menuBar.bootstrap).toBeCalledWith(undefined, {
      testid: "brick-next-menu-bar",
    });
    expect(kernel.appBar.bootstrap).toBeCalledWith(undefined);
    expect(kernel.loadingBar.bootstrap).toBeCalledWith(
      "business-website.loading-bar"
    );
  });

  it("should throw for unknown layout", async () => {
    await expect(
      kernel.layoutBootstrap("oops" as unknown as LayoutType)
    ).rejects.toEqual(new Error("Unknown layout: oops"));
  });

  it("should toggleBars", () => {
    expect(document.body.classList.contains("bars-hidden")).toBe(false);
    kernel.toggleBars(false);
    expect(document.body.classList.contains("bars-hidden")).toBe(true);
    kernel.toggleBars(true);
    expect(document.body.classList.contains("bars-hidden")).toBe(false);
  });

  it("should unset bars", () => {
    kernel.menuBar = {
      resetAppMenu: jest.fn(),
    } as any;
    kernel.appBar = {
      setPageTitle: jest.fn(),
      setBreadcrumb: jest.fn(),
    } as any;
    kernel.toggleBars = jest.fn();
    kernel.currentLayout = "console";
    kernel.unsetBars({ appChanged: true });
    expect(kernel.toggleBars).toBeCalledWith(true);
    expect(kernel.menuBar.resetAppMenu).toBeCalled();
    expect(spyOnApplyPageTitle).toBeCalledWith(null);
    expect(kernel.appBar.setBreadcrumb).toBeCalledWith(null);
  });

  it("should not unset bars for the business layout", () => {
    kernel.menuBar = {
      resetAppMenu: jest.fn(),
    } as any;
    kernel.appBar = {
      setPageTitle: jest.fn(),
      setBreadcrumb: jest.fn(),
    } as any;
    kernel.toggleBars = jest.fn();
    kernel.currentLayout = "business";
    kernel.unsetBars({ appChanged: true });
    expect(kernel.toggleBars).toBeCalled();
    expect(kernel.menuBar.resetAppMenu).not.toBeCalled();
    expect(spyOnApplyPageTitle).toBeCalledWith(null);
    expect(kernel.appBar.setBreadcrumb).not.toBeCalled();
  });

  it("should toggleLegacyIframe", () => {
    expect(document.body.classList.contains("show-legacy-iframe")).toBe(false);
    kernel.toggleLegacyIframe(true);
    expect(document.body.classList.contains("show-legacy-iframe")).toBe(true);
    kernel.toggleLegacyIframe(false);
    expect(document.body.classList.contains("show-legacy-iframe")).toBe(false);
  });

  it("should loadDynamicBricksInBrickConf", async () => {
    kernel.bootstrapData = {} as any;
    spyOnGetDllAndDepsByResource.mockImplementationOnce(
      ({ bricks }: { bricks: string[] }) => ({
        dll: ["d3"],
        deps: bricks.map((brick) => brick.split(".")[0]),
      })
    );
    await kernel.loadDynamicBricksInBrickConf({
      brick: "my.test-brick",
    });
    expect(loadScript).toBeCalledTimes(2);
    expect(loadScript).toHaveBeenNthCalledWith(1, ["d3"], undefined);
    expect(loadScript).toHaveBeenNthCalledWith(2, ["my"], undefined);
    expect(loadLazyBricks).toBeCalledWith(["my.test-brick"]);
  });

  it("should loadDynamicBricksInBrickConf again after failed once", async () => {
    kernel.bootstrapData = {} as any;
    spyOnGetDllAndDepsByResource
      .mockImplementationOnce(({ bricks }: { bricks: string[] }) => ({
        dll: ["d3.v1"],
        deps: bricks.map((brick) => brick.split(".")[0]),
      }))
      .mockImplementationOnce(({ bricks }: { bricks: string[] }) => ({
        dll: ["d3.v2"],
        deps: bricks.map((brick) => brick.split(".")[0]),
      }));
    spyOnLoadScript.mockImplementationOnce(() => {
      const e = new Event("error");
      Object.defineProperty(e, "target", {
        value: document.createElement("script"),
      });
      throw e;
    });
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [],
    });
    await kernel.loadDynamicBricksInBrickConf({
      brick: "my.test-brick",
    });
    expect(loadScript).toBeCalledTimes(3);
    expect(loadScript).toHaveBeenNthCalledWith(1, ["d3.v1"], undefined);
    expect(loadScript).toHaveBeenNthCalledWith(2, ["d3.v2"], undefined);
    expect(loadScript).toHaveBeenNthCalledWith(3, ["my"], undefined);
    expect(loadLazyBricks).toBeCalledWith(["my.test-brick"]);
  });

  it("should loadEditorBricks", async () => {
    kernel.bootstrapData = {} as any;
    await kernel.loadEditorBricks(["my.test-brick--editor"]);
    expect(loadScript).toHaveBeenNthCalledWith(1, [], undefined);
    expect(loadScript).toHaveBeenNthCalledWith(2, ["my/editors"], undefined);
  });

  it("should getProviderBrick", async () => {
    kernel.bootstrapData = {} as any;
    await kernel.getProviderBrick("my.test-provider");
    expect(loadScript).toHaveBeenNthCalledWith(1, [], undefined);
    expect(loadScript).toHaveBeenNthCalledWith(2, [], undefined);
  });

  it("should getProviderBrick for legacy custom api", async () => {
    kernel.bootstrapData = {} as any;
    await kernel.getProviderBrick("easyops.custom_api@myAwesomeApi");
    expect(loadScript).toHaveBeenNthCalledWith(1, [], undefined);
    expect(loadScript).toHaveBeenNthCalledWith(2, [], undefined);
    const searchAllMicroAppApiOrchestration =
      InstanceApi_postSearch as jest.Mock;
    const usedCustomApis = [
      {
        name: "myAwesomeApi",
        namespace: "easyops.custom_api",
      },
    ];
    searchAllMicroAppApiOrchestration.mockResolvedValueOnce({
      list: usedCustomApis,
    });
    kernel.loadMicroAppApiOrchestrationAsync([]);
    expect(searchAllMicroAppApiOrchestration).not.toBeCalled();
    kernel.loadMicroAppApiOrchestrationAsync(usedCustomApis);
    const allMicroAppApiOrchestrationMap =
      await kernel.getMicroAppApiOrchestrationMapAsync();
    expect(searchAllMicroAppApiOrchestration).toBeCalledWith(
      "MICRO_APP_API_ORCHESTRATION",
      {
        page: 1,
        page_size: 1,
        fields: {
          name: true,
          namespace: true,
          contract: true,
          config: true,
          type: true,
        },
        query: {
          $or: usedCustomApis,
        },
      }
    );
    expect(
      allMicroAppApiOrchestrationMap.has("easyops.custom_api@myAwesomeApi")
    ).toBe(true);
  });

  it("should getProviderBrick when flow api", async () => {
    kernel.bootstrapData = {} as any;
    await kernel.getProviderBrick("easyops.custom_api@myAwesomeApi:1.2.0");
    expect(loadScript).toHaveBeenNthCalledWith(1, [], undefined);
    expect(loadScript).toHaveBeenNthCalledWith(2, [], undefined);
    const searchAllMicroAppApiOrchestration =
      InstanceApi_postSearch as jest.Mock;
    const usedCustomApis = [
      {
        name: "myAwesomeApi:1.2.0",
        namespace: "easyops.custom_api",
      },
    ];
    kernel.loadMicroAppApiOrchestrationAsync(usedCustomApis);
    const allMicroAppApiOrchestrationMap =
      await kernel.getMicroAppApiOrchestrationMapAsync();
    expect(searchAllMicroAppApiOrchestration).not.toBeCalled();
    expect(allMicroAppApiOrchestrationMap.size).toBe(0);
  });

  it("should throw if getProviderBrick with not defined provider", async () => {
    kernel.bootstrapData = {} as any;
    expect.assertions(3);
    try {
      await kernel.getProviderBrick("my.not-defined-provider");
    } catch (error) {
      expect(error.message).toBe(
        'Provider not defined: "my.not-defined-provider".'
      );
      expect(loadScript).toHaveBeenNthCalledWith(1, [], undefined);
      expect(loadScript).toHaveBeenNthCalledWith(2, ["my"], undefined);
    }
  });

  it("should prefetch deps of storyboard", () => {
    kernel.bootstrapData = {} as any;
    const storyboard = {} as any;
    spyOnGetDllAndDepsOfStoryboard.mockReturnValueOnce({
      dll: ["d3.js"],
      deps: ["dep.js"],
      bricks: [],
      eager: {
        dll: [],
        deps: [],
      },
    });
    spyOnGetTemplateDepsOfStoryboard.mockReturnValueOnce(["layout.js"]);

    // First prefetch.
    kernel.prefetchDepsOfStoryboard(storyboard);
    expect(storyboard.$$depsProcessed).toBe(true);
    // Prefetch again.
    kernel.prefetchDepsOfStoryboard(storyboard);

    expect(prefetchScript).toBeCalledTimes(3);
    expect(prefetchScript).toHaveBeenNthCalledWith(1, ["layout.js"], undefined);
    expect(prefetchScript).toHaveBeenNthCalledWith(2, ["d3.js"], undefined);
    expect(prefetchScript).toHaveBeenNthCalledWith(3, ["dep.js"], undefined);
  });

  it("should load users async", async () => {
    searchAllUsersInfo.mockResolvedValueOnce({
      list: [
        {
          name: "hello",
          instanceId: "abc",
        },
      ],
    });
    kernel.loadUsersAsync();
    // Multiple invocations will trigger request only once.
    kernel.loadUsersAsync();
    await (global as any).flushPromises();
    expect(searchAllUsersInfo).toBeCalledTimes(1);
    expect(await kernel.allUserMapPromise).toMatchInlineSnapshot(`
      Map {
        "hello" => Object {
          "instanceId": "abc",
          "name": "hello",
        },
      }
    `);
  });

  it("should load magic brick config async", async () => {
    searchAllMagicBrickConfig.mockResolvedValueOnce({
      list: [
        {
          brick: "presentational-bricks.brick-link",
          instanceId: "59c7b02603e96",
          properties: "target: _blank",
          scene: "read",
          selector: "HOST.ip",
          transform:
            'url: "/next/legacy/cmdb-instance-management/HOST/instance/@{instanceId}"\nlabel: "@{ip}"',
        },
      ],
    });
    kernel.loadMagicBrickConfigAsync();
    // Multiple invocations will trigger request only once.
    kernel.loadMagicBrickConfigAsync();
    await (global as any).flushPromises();
    expect(searchAllMagicBrickConfig).toBeCalledTimes(1);
    expect(await kernel.allMagicBrickConfigMapPromise).toMatchInlineSnapshot(`
      Map {
        "HOST.ip" => Object {
          "brick": "presentational-bricks.brick-link",
          "instanceId": "59c7b02603e96",
          "properties": "target: _blank",
          "scene": "read",
          "selector": "HOST.ip",
          "transform": "url: \\"/next/legacy/cmdb-instance-management/HOST/instance/@{instanceId}\\"
      label: \\"@{ip}\\"",
        },
      }
    `);
  });

  it("should init analytics in bootstrap when gaMeasurementId in misc is set", async () => {
    const gaMeasurementId = "GA-MEASUREMENT-ID";
    const analyticsDebugMode = true;
    const userInstanceId = "user-instance-id";

    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          routes: [],
        },
      ],
      brickPackages: [],
    });
    await kernel.bootstrap({} as any);
    expect(mockInitAnalytics).toBeCalled();
  });

  it("should get standalone menus", async () => {
    kernel.currentApp = {
      id: "app-b",
    } as any;
    kernel.bootstrapData = {
      storyboards: [
        {
          app: {
            id: "app-a",
          },
        },
        {
          app: {
            id: "app-b",
          },
          meta: {
            menus: [
              {
                menuId: "menu-1",
                title: "Menu 1",
              },
              {
                menuId: "menu-2",
                title: "Menu 2",
              },
              {
                menuId: "menu-1",
                title: "Menu 1 Alternative",
              },
            ],
          },
        },
      ],
    } as any;
    const menus = await kernel.getStandaloneMenus("menu-1");
    expect(menus).toEqual([
      {
        menuId: "menu-1",
        title: "Menu 1",
        app: [{ appId: "app-b" }],
      },
      {
        menuId: "menu-1",
        title: "Menu 1 Alternative",
        app: [{ appId: "app-b" }],
      },
    ]);
  });

  it("should get standalone inject menus", async () => {
    kernel.currentApp = {
      id: "app-b",
    } as any;
    kernel.bootstrapData = {
      storyboards: [
        {
          app: {
            id: "app-a",
          },
        },
        {
          app: {
            id: "app-b",
          },
          meta: {
            injectMenus: [
              {
                menuId: "menu-1",
                title: "Menu 1",
              },
              {
                menuId: "menu-2",
                title: "Menu 2",
              },
              {
                menuId: "menu-1",
                title: "Menu 1 Alternative",
              },
            ],
          },
        },
      ],
    } as any;
    const menus = await kernel.getStandaloneMenus("menu-1");
    expect(menus).toEqual([
      {
        menuId: "menu-1",
        title: "Menu 1",
        app: [{ appId: "app-b" }],
      },
      {
        menuId: "menu-1",
        title: "Menu 1 Alternative",
        app: [{ appId: "app-b" }],
      },
    ]);
  });

  it("should get empty standalone menus", async () => {
    kernel.currentApp = {
      id: "app-a",
    } as any;
    kernel.bootstrapData = {
      storyboards: [
        {
          app: {
            id: "app-a",
          },
        },
      ],
    } as any;
    const menus = await kernel.getStandaloneMenus("menu-1");
    expect(menus).toEqual([]);
  });

  it("should get standalone from outside app menus", async () => {
    const mockSearchMenu = InstanceApi_postSearch as jest.Mock;
    mockSearchMenu.mockResolvedValueOnce({
      list: [
        {
          menuId: "menu-3",
          title: "menu-3-form-outside",
          app: [
            {
              appId: "app-outside",
            },
          ],
        },
      ],
    });
    const mockSearchMenu_new = InstalledMicroAppApi_getMenusInfo as jest.Mock;
    mockSearchMenu_new.mockResolvedValueOnce({
      menus: [
        {
          menuId: "menu-3",
          title: "menu-3-form-outside-new",
          app: [
            {
              appId: "app-outside-new",
            },
          ],
        },
      ],
    });
    const getFeatureFlags = jest.fn().mockReturnValue({});

    kernel.currentApp = {
      id: "app-b",
    } as any;
    kernel.bootstrapData = {
      storyboards: [
        {
          app: {
            id: "app-b",
          },
          meta: {
            menus: [
              {
                menuId: "menu-1",
                title: "Menu 1",
              },
            ],
          },
        },
      ],
    } as any;
    kernel.getFeatureFlags = getFeatureFlags;
    const menus = await kernel.getStandaloneMenus("menu-3");
    expect(menus).toEqual([
      {
        menuId: "menu-3",
        title: "menu-3-form-outside",
        app: [
          {
            appId: "app-outside",
          },
        ],
      },
    ]);

    getFeatureFlags.mockReturnValueOnce({ "three-level-menu-layout": true });
    const menus_new = await kernel.getStandaloneMenus("menu-3");
    expect(menus_new).toEqual([
      {
        menuId: "menu-3",
        title: "menu-3-form-outside-new",
        app: [
          {
            appId: "app-outside-new",
          },
        ],
      },
    ]);
  });

  it("should apply custom theme", async () => {
    const mountPoints: MountPoints = {
      appBar: document.createElement("div") as any,
      menuBar: document.createElement("div") as any,
      loadingBar: document.createElement("div") as any,
      main: document.createElement("div") as any,
      bg: document.createElement("div") as any,
      portal: document.createElement("div") as any,
    };

    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    spyOnIsLoggedIn.mockReturnValueOnce(true);

    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          routes: [],
        },
      ],
      brickPackages: [
        {
          filePath: "all.js",
        },
      ],
      templatePackages: [
        {
          filePath: "layout.js",
        },
      ],
      settings: {
        misc: {
          theme: {
            brandColor: {
              light: "#6b6b6b",
              dark: "red",
            },
          },
        },
      },
    });
    await kernel.bootstrap(mountPoints);

    expect(spyApplyColorTheme.mock.calls[0][0]).toEqual({
      dark: "red",
      light: "#6b6b6b",
      type: "brandColor",
    });

    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });

    spyOnIsLoggedIn.mockReturnValueOnce(true);

    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          routes: [],
        },
      ],
      brickPackages: [
        {
          filePath: "all.js",
        },
      ],
      templatePackages: [
        {
          filePath: "layout.js",
        },
      ],
      settings: {
        misc: {
          theme: {
            baseColors: {
              light: {
                red: "#6b6b6b",
              },
              dark: {
                red: "#555",
              },
            },
          },
        },
      },
    });
    await kernel.bootstrap(mountPoints);

    expect(spyApplyColorTheme.mock.calls[1][0]).toEqual({
      dark: {
        red: "#555",
      },
      light: {
        red: "#6b6b6b",
      },
      type: "baseColors",
    });

    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    spyOnIsLoggedIn.mockReturnValueOnce(true);

    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          routes: [],
        },
      ],
      brickPackages: [
        {
          filePath: "all.js",
        },
      ],
      templatePackages: [
        {
          filePath: "layout.js",
        },
      ],
      settings: {
        misc: {
          theme: {
            variables: {
              light: {
                "--color-brand": "yellow",
              },
              dark: {
                "--color-brand": "yellow",
              },
            },
          },
        },
      },
    });
    await kernel.bootstrap(mountPoints);

    expect(spyApplyColorTheme.mock.calls[2][0]).toEqual({
      dark: {
        "--color-brand": "yellow",
      },
      light: {
        "--color-brand": "yellow",
      },
      type: "variables",
    });
  });

  it("should update storyboard", async () => {
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          app: {
            id: "app-a",
            homepage: "/app-a",
          },
          routes: [
            {
              alias: "home",
              path: "${APP.homepage}",
              bricks: [],
            },
          ],
        },
        {
          app: {
            id: "app-b",
            homepage: "/app-b",
          },
          routes: [
            {
              alias: "home",
              path: "${APP.homepage}",
              bricks: [],
            },
          ],
          $$fulfilling: false,
          $$fulfilled: false,
        },
      ],
    });
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    spyOnIsLoggedIn.mockReturnValueOnce(true);
    await kernel.bootstrap({} as any);
    kernel._dev_only_updateStoryboard("app-b", {
      routes: [
        {
          alias: "new-home",
          path: "${APP.homepage}/new",
          bricks: [],
        },
      ],
    });
    expect(kernel.bootstrapData.storyboards).toEqual([
      {
        app: {
          id: "app-a",
          homepage: "/app-a",
          config: {},
        },
        routes: [
          {
            alias: "home",
            path: "${APP.homepage}",
            bricks: [],
          },
        ],
      },
      {
        app: {
          id: "app-b",
          homepage: "/app-b",
          config: {},
        },
        routes: [
          {
            alias: "new-home",
            path: "${APP.homepage}/new",
            bricks: [],
          },
        ],
        $$fulfilling: null,
        $$fulfilled: true,
        $$registerCustomTemplateProcessed: false,
        $$depsProcessed: false,
      },
    ]);
  });

  it("should update storyboard by route", async () => {
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          app: {
            id: "app-a",
            homepage: "/app-a",
          },
          routes: [
            {
              alias: "home",
              path: "${APP.homepage}",
              bricks: [],
            },
          ],
        },
        {
          app: {
            id: "app-b",
            homepage: "/app-b",
          },
          routes: [
            {
              alias: "page1",
              path: "${APP.homepage}/page1",
              bricks: [],
            },
          ],
        },
      ],
    });
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    spyOnIsLoggedIn.mockReturnValueOnce(true);
    await kernel.bootstrap({} as any);
    kernel._dev_only_updateStoryboardByRoute("app-b", {
      alias: "page1",
      path: "${APP.homepage}/page1",
      bricks: [
        {
          brick: "div",
        },
      ],
    });
    expect(kernel.bootstrapData.storyboards).toEqual([
      {
        app: {
          config: {},
          homepage: "/app-a",
          id: "app-a",
          localeName: undefined,
        },
        routes: [{ alias: "home", bricks: [], path: "${APP.homepage}" }],
      },
      {
        app: {
          config: {},
          homepage: "/app-b",
          id: "app-b",
          localeName: undefined,
        },
        routes: [
          {
            alias: "page1",
            bricks: [{ brick: "div" }],
            path: "${APP.homepage}/page1",
          },
        ],
      },
    ]);

    kernel._dev_only_updateStoryboardByRoute("app-b", {
      alias: "page2",
      path: "${APP.homepage}/page2",
      exact: true,
      bricks: [],
    });
    expect(kernel.bootstrapData.storyboards).toEqual([
      {
        app: {
          config: {},
          homepage: "/app-a",
          id: "app-a",
          localeName: undefined,
        },
        routes: [{ alias: "home", bricks: [], path: "${APP.homepage}" }],
      },
      {
        app: {
          config: {},
          homepage: "/app-b",
          id: "app-b",
          localeName: undefined,
        },
        routes: [
          {
            alias: "page2",
            path: "${APP.homepage}/page2",
            exact: true,
            bricks: [],
          },
          {
            alias: "page1",
            bricks: [{ brick: "div" }],
            path: "${APP.homepage}/page1",
          },
        ],
      },
    ]);
  });

  it("should update storyboard by template", async () => {
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          app: {
            id: "app-a",
            homepage: "/app-a",
          },
          routes: [],
        },
        {
          app: {
            id: "app-b",
            homepage: "/app-b",
          },
          routes: [],
        },
      ],
    });
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    spyOnIsLoggedIn.mockReturnValueOnce(true);
    await kernel.bootstrap({} as any);

    kernel._dev_only_updateStoryboardByTemplate(
      "app-b",
      {
        name: "tpl-a",
        proxy: null,
        state: [{ name: "test1", value: "test1" }],
        bricks: [
          {
            brick: "div",
          },
        ],
      },
      {
        properties: {
          textContent: "hello",
        },
      }
    );

    expect(registerCustomTemplate as jest.Mock).toBeCalledWith(
      "app-b.tpl-a",
      {
        proxy: null,
        state: [{ name: "test1", value: "test1" }],
        bricks: [
          {
            brick: "div",
          },
        ],
      },
      "app-b"
    );

    expect(kernel.bootstrapData.storyboards).toEqual([
      {
        app: {
          config: {},
          homepage: "/app-a",
          id: "app-a",
          localeName: undefined,
        },
        routes: [],
      },
      {
        app: {
          config: {},
          homepage: "/app-b",
          id: "app-b",
          localeName: undefined,
        },
        routes: [
          {
            bricks: [{ brick: "tpl-a", properties: { textContent: "hello" } }],
            exact: true,
            menu: false,
            hybrid: false,
            path: "${APP.homepage}/_dev_only_/template-preview/tpl-a",
          },
        ],
      },
    ]);
  });

  it("should update template preview settings", async () => {
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          app: {
            id: "app-a",
            homepage: "/app-a",
          },
          routes: [],
        },
        {
          app: {
            id: "app-b",
            homepage: "/app-b",
          },
          routes: [
            {
              alias: "home",
              path: "${APP.homepage}",
              bricks: [],
            },
          ],
        },
      ],
    });
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    spyOnIsLoggedIn.mockReturnValueOnce(true);
    await kernel.bootstrap({} as any);
    kernel._dev_only_updateTemplatePreviewSettings("app-b", "tpl-c", {
      properties: {
        dataTest: "good",
      },
      events: {
        click: { action: "console.log" },
      },
      lifeCycle: {
        onPageLoad: { action: "message.info" },
      },
      params: [],
      context: [{ name: "quality" }],
    });
    expect(kernel.bootstrapData.storyboards).toEqual([
      {
        app: {
          id: "app-a",
          homepage: "/app-a",
          config: {},
        },
        routes: [],
      },
      {
        app: {
          id: "app-b",
          homepage: "/app-b",
          config: {},
        },
        routes: [
          {
            path: "${APP.homepage}/_dev_only_/template-preview/tpl-c",
            bricks: [
              {
                brick: "tpl-c",
                properties: {
                  dataTest: "good",
                },
                events: {
                  click: { action: "console.log" },
                },
                lifeCycle: {
                  onPageLoad: { action: "message.info" },
                },
                context: [{ name: "quality" }],
              },
            ],
            hybrid: false,
            menu: false,
            exact: true,
          },
          {
            alias: "home",
            path: "${APP.homepage}",
            bricks: [],
          },
        ],
      },
    ]);

    // Update again.
    kernel._dev_only_updateTemplatePreviewSettings("app-b", "tpl-c", {
      properties: {
        dataTest: "better",
      },
    });
    expect(kernel.bootstrapData.storyboards).toEqual([
      {
        app: {
          id: "app-a",
          homepage: "/app-a",
          config: {},
        },
        routes: [],
      },
      {
        app: {
          id: "app-b",
          homepage: "/app-b",
          config: {},
        },
        routes: [
          {
            path: "${APP.homepage}/_dev_only_/template-preview/tpl-c",
            bricks: [
              {
                brick: "tpl-c",
                properties: {
                  dataTest: "better",
                },
              },
            ],
            menu: false,
            exact: true,
            hybrid: false,
          },
          {
            alias: "home",
            path: "${APP.homepage}",
            bricks: [],
          },
        ],
      },
    ]);
  });

  it("should update snippet preview settings", async () => {
    const mockStoryBoard = [
      {
        app: {
          id: "app-a",
          homepage: "/app-a",
        },
        routes: [],
      },
      {
        app: {
          id: "app-b",
          homepage: "/app-b",
        },
        routes: [
          {
            alias: "home",
            path: "${APP.homepage}",
          },
        ],
      },
    ];
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: mockStoryBoard,
    });
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    spyOnIsLoggedIn.mockReturnValueOnce(true);
    await kernel.bootstrap({} as any);
    kernel._dev_only_updateSnippetPreviewSettings("app-b", {
      snippetId: "snippet-a",
      bricks: [
        {
          brick: "button",
          properties: {
            buttonName: "123",
          },
        },
      ],
    });
    expect(mockStoryBoard).toMatchInlineSnapshot(`
      Array [
        Object {
          "app": Object {
            "config": Object {},
            "homepage": "/app-a",
            "id": "app-a",
            "localeName": undefined,
          },
          "routes": Array [],
        },
        Object {
          "app": Object {
            "config": Object {},
            "homepage": "/app-b",
            "id": "app-b",
            "localeName": undefined,
          },
          "routes": Array [
            Object {
              "bricks": Array [
                Object {
                  "brick": "button",
                  "properties": Object {
                    "buttonName": "123",
                  },
                },
              ],
              "exact": true,
              "hybrid": false,
              "menu": false,
              "path": "\${APP.homepage}/_dev_only_/snippet-preview/snippet-a",
            },
            Object {
              "alias": "home",
              "path": "\${APP.homepage}",
            },
          ],
        },
      ]
    `);

    // Update again.
    kernel._dev_only_updateSnippetPreviewSettings("app-b", {
      snippetId: "snippet-a",
      bricks: [
        {
          brick: "button",
          properties: {
            buttonName: "234",
          },
        },
      ],
    });

    expect(mockStoryBoard).toMatchInlineSnapshot(`
      Array [
        Object {
          "app": Object {
            "config": Object {},
            "homepage": "/app-a",
            "id": "app-a",
            "localeName": undefined,
          },
          "routes": Array [],
        },
        Object {
          "app": Object {
            "config": Object {},
            "homepage": "/app-b",
            "id": "app-b",
            "localeName": undefined,
          },
          "routes": Array [
            Object {
              "bricks": Array [
                Object {
                  "brick": "button",
                  "properties": Object {
                    "buttonName": "234",
                  },
                },
              ],
              "exact": true,
              "hybrid": false,
              "menu": false,
              "path": "\${APP.homepage}/_dev_only_/snippet-preview/snippet-a",
            },
            Object {
              "alias": "home",
              "path": "\${APP.homepage}",
            },
          ],
        },
      ]
    `);
  });

  it("should update form preview settings", async () => {
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          app: {
            id: "app-a",
            homepage: "/app-a",
          },
          routes: [],
        },
        {
          app: {
            id: "app-b",
            homepage: "/app-b",
          },
          routes: [
            {
              alias: "home",
              path: "${APP.homepage}",
              bricks: [],
            },
          ],
        },
      ],
    });
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    });
    spyOnIsLoggedIn.mockReturnValueOnce(true);
    await kernel.bootstrap({} as any);
    kernel._dev_only_updateFormPreviewSettings("app-b", "form-c", {
      schema: {
        brick: "forms.general-form",
        bricks: [
          {
            brick: "basic-bricks.grid-layout",
            bricks: [
              {
                quote: "userName",
              },
            ],
            properties: {
              columns: 1,
              id: "grid_252",
              title: "行容器",
            },
          },
        ],
        properties: {
          formItemConfig: {},
          id: "form_251",
          sectionConfig: {},
          values: {},
        },
      },
      fields: [
        {
          _object_id: "FORM_MODEL_FIELD@EASYOPS",
          creator: "easyops",
          ctime: "2022-05-30 10:27:25",
          defaultValue: "0",
          description: "不允许特殊字符",
          id: "userName",
          instanceId: "5e0316589e322",
          limit: ["required"],
          modifier: "easyops",
          mtime: "2022-06-07 15:34:11",
          name: "用户名",
          type: "STRING",
        } as any,
      ],
    });
    expect(kernel.bootstrapData.storyboards).toEqual([
      {
        app: {
          config: {},
          homepage: "/app-a",
          id: "app-a",
          localeName: undefined,
        },
        routes: [],
      },
      {
        app: {
          config: {},
          homepage: "/app-b",
          id: "app-b",
          localeName: undefined,
        },
        routes: [
          {
            bricks: [
              {
                brick: formRenderer,
                properties: {
                  formData: {
                    fields: [
                      {
                        _object_id: "FORM_MODEL_FIELD@EASYOPS",
                        creator: "easyops",
                        ctime: "2022-05-30 10:27:25",
                        defaultValue: "0",
                        description: "不允许特殊字符",
                        id: "userName",
                        instanceId: "5e0316589e322",
                        limit: ["required"],
                        modifier: "easyops",
                        mtime: "2022-06-07 15:34:11",
                        name: "用户名",
                        type: "STRING",
                      },
                    ],
                    schema: {
                      brick: "forms.general-form",
                      bricks: [
                        {
                          brick: "basic-bricks.grid-layout",
                          bricks: [
                            {
                              quote: "userName",
                            },
                          ],

                          properties: {
                            columns: 1,
                            id: "grid_252",
                            title: "行容器",
                          },
                        },
                      ],
                      properties: {
                        formItemConfig: {},
                        id: "form_251",
                        sectionConfig: {},
                        values: {},
                      },
                    },
                  },
                  isPreview: true,
                },
              },
            ],
            exact: true,
            menu: false,
            path: "${APP.homepage}/_dev_only_/form-preview/form-c",
          },
          {
            alias: "home",
            bricks: [],
            path: "${APP.homepage}",
          },
        ],
      },
    ]);
  });
});
