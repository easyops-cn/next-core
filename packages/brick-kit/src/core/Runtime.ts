import { Kernel, MenuBar, AppBar } from "./exports";
import {
  MountPoints,
  MicroApp,
  InterceptorParams,
  FeatureFlags,
  DesktopData
} from "@easyops/brick-types";

let kernel: Kernel;

export class Runtime {
  async bootstrap(mountPoints: MountPoints): Promise<void> {
    if (kernel !== undefined) {
      throw new Error("Cannot bootstrap more than once.");
    }
    kernel = new Kernel();
    await kernel.bootstrap(mountPoints);
  }

  get menuBar(): MenuBar {
    return kernel.menuBar;
  }

  get appBar(): AppBar {
    return kernel.appBar;
  }

  getMicroApps({ excludeInstalling = false } = {}): MicroApp[] {
    const apps = kernel.bootstrapData.microApps;
    if (excludeInstalling) {
      return apps.filter(
        app => !(app.installStatus && app.installStatus === "running")
      );
    }
    return apps;
  }

  reloadMicroApps(interceptorParams?: InterceptorParams): Promise<void> {
    return kernel.loadMicroApps(
      {
        check_login: true
      },
      interceptorParams
    );
  }

  getDesktops(): DesktopData[] {
    return kernel.bootstrapData.desktops || [];
  }

  /**
   * 切换主体内容 `filter: blur(...)`;
   * @param blur
   */
  toggleFilterOfBlur(blur: boolean): void {
    document.body.classList.toggle("filter-of-blur", blur);
  }

  getFeatureFlags(): FeatureFlags {
    return Object.assign(
      {},
      kernel.bootstrapData.settings &&
        kernel.bootstrapData.settings.featureFlags
    );
  }

  getHomepage(): string {
    return (
      (kernel.bootstrapData.settings &&
        kernel.bootstrapData.settings.homepage) ||
      "/"
    );
  }

  getLaunchpadSettings(): { columns: number; rows: number } {
    return Object.assign(
      {
        columns: 7,
        rows: 4
      },
      kernel.bootstrapData.settings && kernel.bootstrapData.settings.launchpad
    );
  }
}
