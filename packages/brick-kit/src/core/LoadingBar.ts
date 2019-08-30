import { getDllAndDepsOfBricks, loadScript } from "@easyops/brick-utils";
import { Kernel } from "./exports";

export class LoadingBar {
  public element: HTMLElement;

  constructor(private kernel: Kernel) {}

  async bootstrap(): Promise<void> {
    const { navbar, brickPackages } = this.kernel.bootstrapData;
    const { dll, deps } = getDllAndDepsOfBricks(
      [navbar.loadingBar],
      brickPackages
    );
    await loadScript(dll);
    await loadScript(deps);
    this.element = document.createElement(navbar.loadingBar);
    this.kernel.mountPoints.loadingBar.appendChild(this.element);
  }
}
