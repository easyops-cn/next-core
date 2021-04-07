import { BaseBar } from "./BaseBar";
import { Kernel } from "../Kernel";

describe("BaseBar", () => {
  const loadingBarMountPoint = document.createElement("div");
  const mockLoadDynamicBricks = jest.fn();
  const kernel: Kernel = {
    mountPoints: {
      loadingBar: loadingBarMountPoint,
    },
    loadDynamicBricks: mockLoadDynamicBricks,
  } as any;

  afterEach(() => {
    loadingBarMountPoint.innerHTML = "";
    jest.clearAllMocks();
  });

  it("should bootstrap", async () => {
    const loadingBar = new BaseBar(kernel, "loadingBar");
    await loadingBar.bootstrap("p");
    expect(mockLoadDynamicBricks).toBeCalledWith(["p"]);
    expect(loadingBarMountPoint.firstChild.nodeName.toLowerCase()).toBe("p");

    // This simulates bootstrapping with the same brick.
    await loadingBar.bootstrap("p");
    expect(mockLoadDynamicBricks).toBeCalledTimes(1);
    expect(loadingBarMountPoint.firstChild.nodeName.toLowerCase()).toBe("p");

    // This simulates bootstrapping with a new brick.
    await loadingBar.bootstrap("div");
    expect(mockLoadDynamicBricks).toBeCalledTimes(2);
    expect(mockLoadDynamicBricks).toBeCalledWith(["div"]);
    expect(loadingBarMountPoint.firstChild.nodeName.toLowerCase()).toBe("div");

    // This simulates bootstrapping with an undefined brick.
    await loadingBar.bootstrap(undefined);
    expect(mockLoadDynamicBricks).toBeCalledTimes(2);
    expect(loadingBarMountPoint.childNodes.length).toBe(0);
  });
});
