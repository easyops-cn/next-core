import { LoadingBar } from "./LoadingBar";
import { Kernel } from "./Kernel";

describe("LoadingBar", () => {
  const loadingBarElement = document.createElement("div");
  const kernel: Kernel = {
    bootstrapData: {
      navbar: {
        loadingBar: "p",
      },
    },
    mountPoints: {
      loadingBar: loadingBarElement,
    },
    loadDynamicBricks: jest.fn(),
  } as any;

  afterEach(() => {
    loadingBarElement.innerHTML = "";
  });

  it("should bootstrap", async () => {
    (kernel.loadDynamicBricks as jest.Mock).mockClear();
    const loadingBar = new LoadingBar(kernel);
    await loadingBar.bootstrap();
    expect(kernel.loadDynamicBricks).toBeCalledWith(["p"]);
    expect(loadingBarElement.firstChild.nodeName).toBe("P");
  });
});
