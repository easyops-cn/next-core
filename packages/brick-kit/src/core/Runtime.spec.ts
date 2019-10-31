import { Kernel } from "./Kernel";
import { Runtime } from "./Runtime";
import { MountPoints } from "@easyops/brick-types";

jest.mock("./Kernel");

const spyOnKernel = Kernel as jest.Mock;

describe("Runtime", () => {
  let runtime: Runtime;
  let IsolatedRuntime: typeof Runtime;

  beforeEach(() => {
    jest.isolateModules(() => {
      IsolatedRuntime = require("./Runtime").Runtime;
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
          name: "a"
        },
        {
          name: "b",
          installStatus: "ok"
        },
        {
          installStatus: "running"
        }
      ]
    };
    expect(runtime.getMicroApps()).toEqual([
      {
        name: "a"
      },
      {
        name: "b",
        installStatus: "ok"
      },
      {
        installStatus: "running"
      }
    ]);
    expect(runtime.getMicroApps({ excludeInstalling: true })).toEqual([
      {
        name: "a"
      },
      {
        name: "b",
        installStatus: "ok"
      }
    ]);
  });

  it("should reload micro apps", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.loadMicroApps = jest.fn();
    runtime.reloadMicroApps();
    expect(mockKernelInstance.loadMicroApps).toBeCalled();
  });

  it("should get feature flags", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.bootstrapData = {
      settings: {
        featureFlags: {
          cool: true
        }
      }
    };
    expect(runtime.getFeatureFlags()).toEqual({
      cool: true
    });
  });

  it("should get empty feature flags if no settings", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.bootstrapData = {};
    expect(runtime.getFeatureFlags()).toEqual({});
  });

  it("should get homepage", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.bootstrapData = {
      settings: {
        homepage: "/search"
      }
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
          columns: 5
        }
      }
    };
    expect(runtime.getLaunchpadSettings()).toEqual({
      columns: 5,
      rows: 4
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
          items: []
        }
      ]
    };
    expect(runtime.getDesktops()).toEqual([
      {
        items: []
      }
    ]);
  });

  it("getAllUserInfo should work", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.allUserInfo = [];
    expect(runtime.getAllUserInfo()).toEqual([]);
  });

  it("getAllUserMap should work", async () => {
    const mountPoints: MountPoints = {} as any;
    await runtime.bootstrap(mountPoints);
    const mockKernelInstance = spyOnKernel.mock.instances[0];
    mockKernelInstance.allUserMap = new Map();
    expect(runtime.getAllUserMap().size).toBe(0);
  });
});
