import { checkLogin, bootstrap } from "@sdk/auth-sdk";
import { UserAdminApi } from "@sdk/user-service-sdk";
import { ObjectMicroAppApi } from "@sdk/micro-app-sdk";
import { MountPoints } from "@easyops/brick-types";
import { Kernel } from "./Kernel";
import { authenticate, isLoggedIn } from "../auth";
import { MenuBar } from "./MenuBar";
import { AppBar } from "./AppBar";
import { Router } from "./Router";
import * as mockHistory from "../history";

jest.mock("@sdk/auth-sdk");
jest.mock("@sdk/user-service-sdk");
jest.mock("@sdk/micro-app-sdk");
jest.mock("./MenuBar");
jest.mock("./AppBar");
jest.mock("./LoadingBar");
jest.mock("./Router");
jest.mock("../auth");

const historyPush = jest.fn();
jest.spyOn(mockHistory, "getHistory").mockReturnValue({
  push: historyPush,
  location: {
    pathname: "/from"
  }
} as any);

const spyOnCheckLogin = checkLogin as jest.Mock;
const spyOnBootstrap = bootstrap as jest.Mock;
const spyOnAuthenticate = authenticate as jest.Mock;
const spyOnIsLoggedIn = isLoggedIn as jest.Mock;
const spyOnMenuBar = MenuBar as jest.Mock;
const spyOnAppBar = AppBar as jest.Mock;
const spyOnRouter = Router as jest.Mock;
const searchAllUsersInfo = UserAdminApi.searchAllUsersInfo as jest.Mock;
const getObjectMicroAppList = ObjectMicroAppApi.getObjectMicroAppList as jest.Mock;

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
      bg: document.createElement("div") as any
    };
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: true
    });
    spyOnIsLoggedIn.mockReturnValueOnce(true);
    searchAllUsersInfo.mockResolvedValueOnce({
      list: [
        {
          name: "hello",
          instanceId: "abc"
        }
      ]
    });
    getObjectMicroAppList.mockResolvedValueOnce({
      list: [
        {
          microAppId: "a",
          objectId: "App"
        },
        {
          microAppId: "b",
          objectId: "App"
        },
        {
          microAppId: "c",
          objectId: "Host"
        }
      ]
    });
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          routes: []
        }
      ],
      brickPackages: []
    });
    await kernel.bootstrap(mountPoints);
    expect(spyOnAuthenticate.mock.calls[0][0]).toEqual({
      loggedIn: true
    });
    expect(spyOnMenuBar.mock.instances[0].bootstrap).toBeCalled();
    expect(spyOnAppBar.mock.instances[0].bootstrap).toBeCalled();
    expect(spyOnRouter.mock.instances[0].bootstrap).toBeCalled();

    expect(kernel.getRelatedApps(undefined).length).toBe(0);
    expect(kernel.getRelatedApps("x").length).toBe(0);
    expect(kernel.getRelatedApps("a").length).toBe(2);

    kernel.popWorkspaceStack();
    kernel.updateWorkspaceStack();

    // eslint-disable-next-line require-atomic-updates
    kernel.currentApp = {
      id: "a",
      name: "A"
    } as any;
    // eslint-disable-next-line require-atomic-updates
    kernel.currentUrl = "/a";
    kernel.updateWorkspaceStack();
    expect(kernel.getPreviousWorkspace()).toBe(undefined);

    // eslint-disable-next-line require-atomic-updates
    kernel.currentApp = {
      id: "b",
      name: "B"
    } as any;
    // eslint-disable-next-line require-atomic-updates
    kernel.currentUrl = "/b";
    kernel.updateWorkspaceStack();
    expect(kernel.getPreviousWorkspace()).toBe(undefined);

    // eslint-disable-next-line require-atomic-updates
    kernel.currentApp = {
      id: "c",
      name: "C"
    } as any;
    // eslint-disable-next-line require-atomic-updates
    kernel.currentUrl = "/c";
    kernel.updateWorkspaceStack();
    expect(kernel.getPreviousWorkspace()).toEqual({
      appId: "b",
      appName: "B",
      url: "/b"
    });

    // eslint-disable-next-line require-atomic-updates
    kernel.currentApp = {
      id: "x",
      name: "X"
    } as any;
    // eslint-disable-next-line require-atomic-updates
    kernel.currentUrl = "/x";
    kernel.updateWorkspaceStack();
    expect(kernel.getPreviousWorkspace()).toBe(undefined);

    // `postMessage` did not trigger events.
    // window.postMessage({ type: "auth.guard" }, window.location.origin);
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: window.location.origin,
        data: {
          type: "auth.guard"
        }
      })
    );
    expect(historyPush).toBeCalledWith("/auth/login", {
      from: {
        pathname: "/from"
      }
    });
  });

  it("should bootstrap if not loggedIn", async () => {
    const mountPoints: MountPoints = {
      appBar: document.createElement("div") as any,
      menuBar: document.createElement("div") as any,
      loadingBar: document.createElement("div") as any,
      main: document.createElement("div") as any,
      bg: document.createElement("div") as any
    };
    spyOnCheckLogin.mockResolvedValueOnce({
      loggedIn: false
    });
    spyOnBootstrap.mockResolvedValueOnce({
      storyboards: [
        {
          routes: []
        }
      ],
      brickPackages: []
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
      setAppMenu: jest.fn()
    } as any;
    kernel.appBar = {
      setPageTitle: jest.fn(),
      setBreadcrumb: jest.fn()
    } as any;
    kernel.toggleBars = jest.fn();
    kernel.unsetBars({ appChanged: true });
    expect(kernel.toggleBars).toBeCalledWith(true);
    expect(kernel.menuBar.setAppMenu).toBeCalledWith(null);
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
