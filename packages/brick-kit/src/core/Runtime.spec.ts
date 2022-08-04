import { Kernel } from "./Kernel";
import { Runtime, _internalApiHasMatchedApp } from "./Runtime";
import { getStandaloneInstalledApps } from "../internal/getStandaloneInstalledApps";
import { MountPoints } from "@next-core/brick-types";

jest.mock("./Kernel");

const spyOnKernel = Kernel as jest.Mock;
const spyOnConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => void 0);

describe("Runtime", () => {
  let runtime: Runtime;
  let IsolatedRuntime: typeof Runtime;
  let isolatedInternalApiHasMatchedApp: typeof _internalApiHasMatchedApp;

  beforeEach(() => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require("./Runtime");
      IsolatedRuntime = m.Runtime;
      isolatedInternalApiHasMatchedApp = m._internalApiHasMatchedApp;
    });
    runtime = new IsolatedRuntime();
    spyOnKernel.mockClear();
  });

  it("should bootstrap", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    expect(spyOnKernel).toBeCalled();

    const mockKernelInstance = spyOnKernel.mock.instances[0];
    expect(mockKernelInstance.bootstrap).toBeCalledWith(mountPoints);
    const spyOnMenuBar = (mockKernelInstance.menuBar = {});
    const spyOnAppBar = (mockKernelInstance.appBar = {});

    expect(runtime.menuBar).toBe(spyOnMenuBar);
    expect(runtime.appBar).toBe(spyOnAppBar);
  });

  it("should toggleFilterOfBlur", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);

    expect(document.body.classList.contains("filter-of-blur")).toBe(false);
    runtime.toggleFilterOfBlur(true);
    expect(document.body.classList.contains("filter-of-blur")).toBe(true);
    runtime.toggleFilterOfBlur(false);
    expect(document.body.classList.contains("filter-of-blur")).toBe(false);
  });

  it("should toggleLaunchpadEffect", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);

    expect(document.body.classList.contains("launchpad-open")).toBe(false);
    runtime.toggleLaunchpadEffect(true);
    expect(document.body.classList.contains("launchpad-open")).toBe(true);
    runtime.toggleLaunchpadEffect(false);
    expect(document.body.classList.contains("launchpad-open")).toBe(false);
  });

  it("should throw if bootstrap more than once", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    expect(runtime.bootstrap(mountPoints)).rejects.toThrowError();
  });

  it("should get micro apps", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.bootstrapData = {
      microApps: [
        {
          name: "a",
          id: "app-a",
          currentVersion: "1.2.3",
        },
        {
          name: "b",
          id: "app-b",
          installStatus: "ok",
          currentVersion: "2.3.4",
        },
        {
          id: "app-c",
          installStatus: "running",
          currentVersion: "3.4.5",
        },
        {
          name: "d",
          id: "app-d",
          internal: true,
        },
      ],
    };
    expect(runtime.getMicroApps()).toEqual([
      {
        name: "a",
        id: "app-a",
        currentVersion: "1.2.3",
      },
      {
        name: "b",
        id: "app-b",
        installStatus: "ok",
        currentVersion: "2.3.4",
      },
      {
        id: "app-c",
        installStatus: "running",
        currentVersion: "3.4.5",
      },
    ]);
    expect(runtime.getMicroApps({ excludeInstalling: true })).toEqual([
      {
        name: "a",
        id: "app-a",
        currentVersion: "1.2.3",
      },
      {
        name: "b",
        id: "app-b",
        installStatus: "ok",
        currentVersion: "2.3.4",
      },
    ]);
    expect(
      runtime.getMicroApps({ excludeInstalling: true, includeInternal: true })
    ).toEqual([
      {
        name: "a",
        id: "app-a",
        currentVersion: "1.2.3",
      },
      {
        name: "b",
        id: "app-b",
        installStatus: "ok",
        currentVersion: "2.3.4",
      },
      {
        name: "d",
        id: "app-d",
        internal: true,
      },
    ]);
    expect(runtime.getMicroApps({ includeInternal: true }).length).toBe(4);

    expect(runtime.hasInstalledApp("app-a")).toBe(true);
    expect(runtime.hasInstalledApp("app-b")).toBe(true);
    expect(runtime.hasInstalledApp("app-c")).toBe(false);
    expect(runtime.hasInstalledApp("app-d")).toBe(true);

    expect(runtime.hasInstalledApp("app-a", ">1.1.10")).toBe(true);
    expect(runtime.hasInstalledApp("app-a", "<1.11.0")).toBe(true);
    expect(runtime.hasInstalledApp("app-b", ">=2.3.4")).toBe(true);
    expect(runtime.hasInstalledApp("app-b", "<=2.3.4")).toBe(true);
    expect(runtime.hasInstalledApp("app-b", "=2.3.4")).toBe(true);

    expect(runtime.hasInstalledApp("app-c", ">=1.0.0")).toBe(false);

    expect(spyOnConsoleError).toBeCalledTimes(0);
    expect(runtime.hasInstalledApp("app-a", "1.2.3")).toBe(false);
    expect(spyOnConsoleError).toBeCalledTimes(1);
    expect(runtime.hasInstalledApp("app-a", ">1.2.")).toBe(false);
    expect(spyOnConsoleError).toBeCalledTimes(2);
  });

  it("should hasInstalledApp success on standalone mode", async () => {
    window.STANDALONE_MICRO_APPS = true;
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.bootstrapData = {
      offSiteStandaloneApps: [
        {
          name: "a",
          id: "app-a",
          currentVersion: "1.2.3",
        },
        {
          name: "b",
          id: "app-b",
          installStatus: "ok",
          currentVersion: "2.3.4",
        },
        {
          id: "app-c",
          installStatus: "running",
          currentVersion: "3.4.5",
        },
      ],
    };

    expect(runtime.hasInstalledApp("app-a")).toBe(true);
    expect(runtime.hasInstalledApp("app-b")).toBe(true);
    expect(runtime.hasInstalledApp("app-c")).toBe(false);

    expect(runtime.hasInstalledApp("app-a", ">1.1.10")).toBe(true);
    expect(runtime.hasInstalledApp("app-a", "<1.11.0")).toBe(true);
    expect(runtime.hasInstalledApp("app-b", ">=2.3.4")).toBe(true);
    expect(runtime.hasInstalledApp("app-b", "<=2.3.4")).toBe(true);
    expect(runtime.hasInstalledApp("app-b", "=2.3.4")).toBe(true);
    expect(runtime.hasInstalledApp("app-c", ">=1.0.0")).toBe(false);
  });

  it("should reload micro apps", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.reloadMicroApps = jest.fn();
    runtime.reloadMicroApps();
    expect(mockKernelInstance.reloadMicroApps).toBeCalled();
  });

  it("should get homepage", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.bootstrapData = {
      settings: {
        homepage: "/search",
      },
    };
    expect(runtime.getHomepage()).toEqual("/search");
  });

  it("should get root page if no settings", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.bootstrapData = {};
    expect(runtime.getHomepage()).toEqual("/");
  });

  it("should get launchpad settings", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.bootstrapData = {
      settings: {
        launchpad: {
          columns: 5,
        },
      },
    };
    expect(runtime.getLaunchpadSettings()).toEqual({
      columns: 5,
      rows: 4,
    });
  });

  it("should get brand settings", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.bootstrapData = {
      settings: {
        brand: {
          base_title: "DevOps 管理专家",
        },
      },
    };
    expect(runtime.getBrandSettings()).toEqual({
      base_title: "DevOps 管理专家",
    });
  });

  it("should get misc settings", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.bootstrapData = {
      settings: {
        misc: {
          foo: "bar",
        },
      },
    };
    expect(runtime.getMiscSettings()).toEqual({
      foo: "bar",
    });
  });

  it("should get desktops", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.bootstrapData = {};
    // Default is `[]`
    expect(runtime.getDesktops()).toEqual([]);
    mockKernelInstance.bootstrapData = {
      desktops: [
        {
          items: [],
        },
      ],
    };
    expect(runtime.getDesktops()).toEqual([
      {
        items: [],
      },
    ]);
  });

  it("should apply page title", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.bootstrapData = {};
    runtime.applyPageTitle(null);
    expect(document.title).toBe("DevOps 管理专家");
    runtime.applyPageTitle("Hello");
    expect(document.title).toBe("Hello - DevOps 管理专家");
  });

  it("should check matched app", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    expect(spyOnKernel).toBeCalled();
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.bootstrapData = {
      microApps: [
        {
          id: "app-1",
          homepage: "/app-1",
        },
        {
          id: "app-2",
          homepage: "/app-2",
        },
      ],
    };
    expect(isolatedInternalApiHasMatchedApp("/app-1")).toBe(true);
    expect(isolatedInternalApiHasMatchedApp("/app-2/any")).toBe(true);
    expect(isolatedInternalApiHasMatchedApp("/app-3")).toBe(false);
  });
});
