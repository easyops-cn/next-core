import { checkLogin, bootstrap } from "@sdk/auth-sdk";
import { Kernel } from "./Kernel";
import { MountPoints } from "@easyops/brick-types";
import { authenticate } from "../auth";
import { MenuBar } from "./MenuBar";
import { AppBar } from "./AppBar";
import { Router } from "./Router";

jest.mock("@sdk/auth-sdk");
jest.mock("./MenuBar");
jest.mock("./AppBar");
jest.mock("./LoadingBar");
jest.mock("./Router");
jest.mock("../auth");

const spyOnCheckLogin = checkLogin as jest.Mock;
const spyOnBootstrap = bootstrap as jest.Mock;
const spyOnAuthenticate = authenticate as jest.Mock;
const spyOnMenuBar = MenuBar as jest.Mock;
const spyOnAppBar = AppBar as jest.Mock;
const spyOnRouter = Router as jest.Mock;

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
