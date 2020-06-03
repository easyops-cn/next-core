import {
  loadScript,
  getDllAndDepsOfStoryboard,
  getTemplateDepsOfStoryboard,
} from "@easyops/brick-utils";
import { checkLogin, bootstrap, getAppStoryboard } from "@sdk/auth-sdk";
import { UserAdminApi } from "@sdk/user-service-sdk";
import { ObjectMicroAppApi } from "@sdk/micro-app-sdk";
import { InstanceApi } from "@sdk/cmdb-sdk";
import { MountPoints } from "@easyops/brick-types";
import { Kernel } from "./Kernel";
import { authenticate, isLoggedIn } from "../auth";
import { MenuBar } from "./MenuBar";
import { AppBar } from "./AppBar";
import { Router } from "./Router";
import * as mockHistory from "../history";

jest.mock("@easyops/brick-utils");
jest.mock("@sdk/auth-sdk");
jest.mock("@sdk/user-service-sdk");
jest.mock("@sdk/micro-app-sdk");
jest.mock("@sdk/cmdb-sdk");
jest.mock("./MenuBar");
jest.mock("./AppBar");
jest.mock("./LoadingBar");
jest.mock("./Router");
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
const spyOnGetAppStoryboard = (getAppStoryboard as jest.Mock).mockReturnValue({
  routes: [],
});
const spyOnAuthenticate = authenticate as jest.Mock;
const spyOnIsLoggedIn = isLoggedIn as jest.Mock;
const spyOnMenuBar = MenuBar as jest.Mock;
const spyOnAppBar = AppBar as jest.Mock;
const spyOnRouter = Router as jest.Mock;
const searchAllUsersInfo = UserAdminApi.searchAllUsersInfo as jest.Mock;
const searchAllMagicBrickConfig = InstanceApi.postSearch as jest.Mock;
const getObjectMicroAppList = ObjectMicroAppApi.getObjectMicroAppList as jest.Mock;

const spyOnLoadScript = loadScript as jest.Mock;
const spyOnGetDllAndDepsOfStoryboard = getDllAndDepsOfStoryboard as jest.Mock;
const spyOnGetTemplateDepsOfStoryboard = getTemplateDepsOfStoryboard as jest.Mock;

(window as any).DLL_HASH = {
  d3: "fake-hash",
};

describe("Kernel", () => {
  let kernel: Kernel;

  beforeEach(() => {
    kernel = new Kernel();
  });

  afterEach(() => {
    spyOnAuthenticate.mockClear();
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
    searchAllUsersInfo.mockResolvedValueOnce({
      list: [
        {
          name: "hello",
          instanceId: "abc",
        },
      ],
    });
    searchAllMagicBrickConfig.mockResolvedValueOnce({
      list: [
        {
          _object_id: "_BRICK_MAGIC",
          _object_version: 11,
          _pre_ts: 1579432390,
          _ts: 1579503251,
          _version: 3,
          brick: "presentational-bricks.brick-link",
          creator: "easyops",
          ctime: "2020-01-19 17:43:38",
          instanceId: "59c7b02603e96",
          modifier: "easyops",
          mtime: "2020-01-20 14:54:11",
          org: 8888,
          properties: "target: _blank",
          scene: "read",
          selector: "HOST.ip",
          transform:
            'url: "/next/legacy/cmdb-instance-management/HOST/instance/@{instanceId}"\nlabel: "@{ip}"',
        },
      ],
    });
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
    expect(searchAllMagicBrickConfig).toHaveBeenCalled();
    expect(spyOnAuthenticate.mock.calls[0][0]).toEqual({
      loggedIn: true,
    });
    expect(spyOnMenuBar.mock.instances[0].bootstrap).toBeCalled();
    expect(spyOnAppBar.mock.instances[0].bootstrap).toBeCalled();
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
      dll: ["d3.js"],
      deps: ["dep.js"],
    });
    spyOnGetTemplateDepsOfStoryboard.mockReturnValueOnce(["layout.js"]);
    await kernel.loadDepsOfStoryboard({} as any);
    expect(spyOnLoadScript).toBeCalledTimes(3);
    expect(spyOnLoadScript.mock.calls[0][0]).toEqual(["layout.js"]);
    expect(spyOnLoadScript.mock.calls[1][0]).toEqual(["d3.js"]);
    expect(spyOnLoadScript.mock.calls[2][0]).toEqual(["dep.js"]);

    spyOnLoadScript.mockClear();

    spyOnGetDllAndDepsOfStoryboard.mockReturnValueOnce({
      dll: [],
      deps: [],
    });
    spyOnGetTemplateDepsOfStoryboard.mockReturnValueOnce([]);
    await kernel.loadDepsOfStoryboard({ dependsAll: true } as any);
    expect(spyOnLoadScript).toBeCalledTimes(2);
    expect(spyOnLoadScript.mock.calls[0][0]).toEqual([
      "dll-of-d3.js?fake-hash",
    ]);
    expect(spyOnLoadScript.mock.calls[1][0]).toEqual(["all.js", "layout.js"]);

    const fakeStoryboard = {
      app: {
        id: "fake",
      },
    } as any;
    await kernel.fulfilStoryboard(fakeStoryboard);
    expect(spyOnGetAppStoryboard).toBeCalledWith("fake");
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

  it("should toggleBars", () => {
    expect(document.body.classList.contains("bars-hidden")).toBe(false);
    kernel.toggleBars(false);
    expect(document.body.classList.contains("bars-hidden")).toBe(true);
    kernel.toggleBars(true);
    expect(document.body.classList.contains("bars-hidden")).toBe(false);
  });

  it("should unsetBars", () => {
    kernel.menuBar = {
      resetAppMenu: jest.fn(),
    } as any;
    kernel.appBar = {
      setPageTitle: jest.fn(),
      setBreadcrumb: jest.fn(),
    } as any;
    kernel.toggleBars = jest.fn();
    kernel.unsetBars({ appChanged: true });
    expect(kernel.toggleBars).toBeCalledWith(true);
    expect(kernel.menuBar.resetAppMenu).toBeCalled();
    expect(kernel.appBar.setPageTitle).toBeCalledWith(null);
    expect(kernel.appBar.setBreadcrumb).toBeCalledWith(null);
  });

  it("should toggleLegacyIframe", () => {
    expect(document.body.classList.contains("show-legacy-iframe")).toBe(false);
    kernel.toggleLegacyIframe(true);
    expect(document.body.classList.contains("show-legacy-iframe")).toBe(true);
    kernel.toggleLegacyIframe(false);
    expect(document.body.classList.contains("show-legacy-iframe")).toBe(false);
  });
});
