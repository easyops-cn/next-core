import { MountPoints } from "@next-core/brick-types";
import { Kernel } from "../Kernel";

export class BaseBar {
  public element: HTMLElement;
  private brick: string;

  constructor(private kernel: Kernel, private mountPoint: string) {}

  /**
   * Bars will be bootstrapped every time the layout changes.
   *
   * @param brick - The brick name.
   */
  async bootstrap(brick?: string, options?: { testid: string }): Promise<void> {
    // Ignore if the brick is not changed.
    if (this.brick === brick) {
      return;
    }
    this.brick = brick;

    // Remove the previous bar element.
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    // The new brick may be undefined, which indicates no bar element in current layout.
    if (brick) {
      await this.kernel.loadDynamicBricks([brick]);
      this.element = document.createElement(brick);
      if (options?.testid) {
        this.element.dataset.testid = options.testid;
      }
      this.kernel.mountPoints[this.mountPoint as keyof MountPoints].appendChild(
        this.element
      );
    }
  }
}
