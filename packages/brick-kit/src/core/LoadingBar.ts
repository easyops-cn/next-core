import { Kernel } from "./exports";

export class LoadingBar {
  public element: HTMLElement;

  constructor(private kernel: Kernel) {}

  async bootstrap(): Promise<void> {
    const { navbar } = this.kernel.bootstrapData;
    await this.kernel.loadDynamicBricks([navbar.loadingBar]);
    this.element = document.createElement(navbar.loadingBar);
    this.kernel.mountPoints.loadingBar.appendChild(this.element);
  }
}
