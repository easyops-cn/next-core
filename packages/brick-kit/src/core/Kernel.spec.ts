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
import { checkLogin, bootstrap, getAppStoryboard } from "@next-sdk/auth-sdk";
import { UserAdminApi_searchAllUsersInfo } from "@next-sdk/user-service-sdk";
import { ObjectMicroAppApi_getObjectMicroAppList } from "@next-sdk/micro-app-sdk";
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

i18next.init({
  fallbackLng: "en",
});

jest.mock("@next-core/brick-utils");
jest.mock("@next-sdk/auth-sdk");
jest.mock("@next-sdk/user-service-sdk");
jest.mock("@next-sdk/micro-app-sdk");
jest.mock("@next-sdk/cmdb-sdk");
jest.mock("./Bars");
jest.mock("./Router");
jest.mock("./CustomTemplates");
jest.mock("./LazyBrickRegistry");
jest.mock("../auth");

const historyPush = jest.fn();
jest.spyOn(mockHistory, "getHistory").mockReturnValue({
  push: historyPush,
  location: {
    pathname: "/from",
  },
} as any);

const spyOnCheckLogin = checkLogin as jest.Mock;
const spyOnBootstrap = bootstrap as jest.Mock;
const spyOnGetAppStoryboard = (getAppStoryboard as jest.Mock).mockResolvedValue(
  {
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
  }
);
const spyOnAuthenticate = authenticate as jest.Mock;
const spyOnIsLoggedIn = isLoggedIn as jest.Mock;
const spyOnRouter = Router as jest.Mock;
const searchAllUsersInfo = UserAdminApi_searchAllUsersInfo as jest.Mock;
const searchAllMagicBrickConfig = InstanceApi_postSearch as jest.Mock;
const getObjectMicroAppList =
  ObjectMicroAppApi_getObjectMicroAppList as jest.Mock;

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

(deepFreeze as jest.Mock).mockImplementation((t) => Object.freeze(t));

// Mock a custom element of `my.test-provider`.
customElements.define("my.test-provider", class Tmp extends HTMLElement {});
customElements.define(
  CUSTOM_API_PROVIDER,
  class ProviderCustomApi extends HTMLElement {}
);

(window as any).DLL_PATH = {
  d3: "dll-of-d3.123.js",
  "editor-bricks-helper": "dll-of-editor-bricks-helper.456.js",
  "react-dnd": "dll-of-react-dnd.789.js",
};

describe("Kernel", () => {
  let kernel: Kernel;

  beforeEach(() => {
    kernel = new Kernel();
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
    getObjectMicroAppList.mockResolvedValueOnce({
      list: [
        {
          microAppId: "a",
          objectId: "App",
        },
        {
          microAppId: "b",
          objectId: "App",
        },
        {
          microAppId: "c",
          objectId: "Host",
        },
      ],
    });
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
    // expect(spyOnMenuBar.mock.instances[0].bootstrap).toBeCalled();
    // expect(spyOnAppBar.mock.instances[0].bootstrap).toBeCalled();
    expect(spyOnRouter.mock.instances[0].bootstrap).toBeCalled();

    expect(kernel.getFeatureFlags()).toEqual({
      "load-magic-brick-config": true,
    });
    expect((await kernel.getRelatedAppsAsync(undefined)).length).toBe(0);
    expect((await kernel.getRelatedAppsAsync("x")).length).toBe(0);
    expect((await kernel.getRelatedAppsAsync("a")).length).toBe(2);

    kernel.popWorkspaceStack();
    await kernel.updateWorkspaceStack();

    // eslint-disable-next-line require-atomic-updates
    kernel.currentApp = {
      id: "a",
      name: "A",
    } as any;
    // eslint-disable-next-line require-atomic-updates
    kernel.currentUrl = "/a";
    kernel.updateWorkspaceStack();
    expect(kernel.getPreviousWorkspace()).toBe(undefined);
    expect(kernel.getRecentApps()).toEqual({
      previousApp: undefined,
      currentApp: {
        id: "a",
        name: "A",
      },
      previousWorkspace: undefined,
    });

    // eslint-disable-next-line require-atomic-updates
    kernel.currentApp = {
      id: "b",
      name: "B",
    } as any;
    // eslint-disable-next-line require-atomic-updates
    kernel.currentUrl = "/b";
    kernel.updateWorkspaceStack();
    expect(kernel.getPreviousWorkspace()).toBe(undefined);

    // eslint-disable-next-line require-atomic-updates
    kernel.currentApp = {
      id: "c",
      name: "C",
    } as any;
    // eslint-disable-next-line require-atomic-updates
    kernel.currentUrl = "/c";
    await kernel.updateWorkspaceStack();
    expect(kernel.getPreviousWorkspace()).toEqual({
      appId: "b",
      appName: "B",
      url: "/b",
    });

    // eslint-disable-next-line require-atomic-updates
    kernel.currentApp = {
      id: "x",
      name: "X",
    } as any;
    // eslint-disable-next-line require-atomic-updates
    kernel.currentUrl = "/x";
    await kernel.updateWorkspaceStack();
    expect(kernel.getPreviousWorkspace()).toBe(undefined);

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
    await kernel.loadDepsOfStoryboard(storyboard);
    await kernel.registerCustomTemplatesInStoryboard(storyboard);
    expect(spyOnLoadScript).toBeCalledTimes(4);
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(1, ["layout.js"]);
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(
      2,
      "dll-of-react-dnd.789.js"
    );
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(3, [
      "d3.js",
      "dll-of-editor-bricks-helper.abc.js",
    ]);
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(4, ["dep.js"]);
    expect(loadLazyBricks).toBeCalledTimes(1);
    expect(loadLazyBricks).toBeCalledWith(["my-brick"]);
    expect(loadAllLazyBricks).not.toBeCalled();
    expect(registerCustomTemplate as jest.Mock).toBeCalledWith(
      "tpl-a",
      {
        proxy: {},
        bricks: [],
      },
      "app-a"
    );

    spyOnLoadScript.mockClear();
    (loadLazyBricks as jest.Mock).mockClear();

    spyOnGetDllAndDepsOfStoryboard.mockReturnValueOnce({
      dll: [],
      deps: [],
      bricks: [],
    });
    spyOnGetTemplateDepsOfStoryboard.mockReturnValueOnce([]);
    await kernel.loadDepsOfStoryboard({ dependsAll: true } as any);
    expect(spyOnLoadScript).toBeCalledTimes(3);
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(
      1,
      "dll-of-react-dnd.789.js"
    );
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(2, [
      "dll-of-d3.123.js",
      "dll-of-editor-bricks-helper.456.js",
      "dll-of-react-dnd.789.js",
    ]);
    expect(spyOnLoadScript).toHaveBeenNthCalledWith(3, ["all.js", "layout.js"]);
    expect(loadLazyBricks).not.toBeCalled();
    expect(loadAllLazyBricks).toBeCalled();

    const fakeStoryboard = {
      app: {
        id: "fake",
      },
    } as any;

    // Make two parallel invocations at the same time,
    // it should only fulfil once.
    await Promise.all([
      kernel.fulfilStoryboard(fakeStoryboard),
      kernel.fulfilStoryboard(fakeStoryboard),
    ]);
    expect(spyOnGetAppStoryboard).toBeCalledWith("fake");
    expect(spyOnAddResourceBundle).toBeCalledWith("en", "$app-fake", {
      HELLO: "Hello",
    });
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
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          routes: [],
        },
      ],
      brickPackages: [],
    });
    await kernel.bootstrap(mountPoints);
    expect(spyOnAuthenticate).not.toBeCalled();
  });

  it("should firstRendered", async () => {
    expect(document.body.classList.contains("first-rendered")).toBe(false);
    kernel.firstRendered();
    await jest.runAllTimers();
    expect(document.body.classList.contains("first-rendered")).toBe(true);
  });

  it("should work for easyops layout", async () => {
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
      pageNotFound: "basic-bricks.page-not-found",
      pageError: "basic-bricks.page-error",
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
      pageNotFound: "business-website.page-not-found",
      pageError: "business-website.page-error",
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
    expect(kernel.appBar.setPageTitle).toBeCalledWith(null);
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
    expect(kernel.appBar.setPageTitle).not.toBeCalled();
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
    expect(loadScript).toHaveBeenNthCalledWith(1, ["d3"]);
    expect(loadScript).toHaveBeenNthCalledWith(2, ["my"]);
    expect(loadLazyBricks).toBeCalledWith(["my.test-brick"]);
  });

  it("should loadEditorBricks", async () => {
    kernel.bootstrapData = {} as any;
    await kernel.loadEditorBricks(["my.test-brick--editor"]);
    expect(loadScript).toHaveBeenNthCalledWith(1, []);
    expect(loadScript).toHaveBeenNthCalledWith(2, ["my/editors"]);
  });

  it("should getProviderBrick", async () => {
    kernel.bootstrapData = {} as any;
    await kernel.getProviderBrick("my.test-provider");
    expect(loadScript).toHaveBeenNthCalledWith(1, []);
    expect(loadScript).toHaveBeenNthCalledWith(2, []);
  });

  it("should getProviderBrick for legacy custom api", async () => {
    kernel.bootstrapData = {} as any;
    await kernel.getProviderBrick("easyops.custom_api@myAwesomeApi");
    expect(loadScript).toHaveBeenNthCalledWith(1, []);
    expect(loadScript).toHaveBeenNthCalledWith(2, []);
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
    expect(loadScript).toHaveBeenNthCalledWith(1, []);
    expect(loadScript).toHaveBeenNthCalledWith(2, []);
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
      expect(loadScript).toHaveBeenNthCalledWith(1, []);
      expect(loadScript).toHaveBeenNthCalledWith(2, ["my"]);
    }
  });

  it("should prefetch deps of storyboard", () => {
    kernel.bootstrapData = {} as any;
    const storyboard = {} as any;
    spyOnGetDllAndDepsOfStoryboard.mockReturnValueOnce({
      dll: ["d3.js"],
      deps: ["dep.js"],
      bricks: [],
    });
    spyOnGetTemplateDepsOfStoryboard.mockReturnValueOnce(["layout.js"]);

    // First prefetch.
    kernel.prefetchDepsOfStoryboard(storyboard);
    expect(storyboard.$$depsProcessed).toBe(true);
    // Prefetch again.
    kernel.prefetchDepsOfStoryboard(storyboard);

    expect(prefetchScript).toBeCalledTimes(2);
    expect(prefetchScript).toHaveBeenNthCalledWith(1, ["layout.js"]);
    expect(prefetchScript).toHaveBeenNthCalledWith(2, ["d3.js", "dep.js"]);
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
});
