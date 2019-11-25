import { Kernel, MenuBar, AppBar } from "./exports";
import {
  MountPoints,
  MicroApp,
  InterceptorParams,
  FeatureFlags,
  DesktopData,
  BrickTemplateFactory,
  UserInfo,
  BrickPackage
} from "@easyops/brick-types";
import { registerBrickTemplate } from "./TemplateRegistries";

let kernel: Kernel;

export function _dev_only_getBrickPackages(): BrickPackage[] {
  return kernel.bootstrapData.brickPackages;
}

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

  getMicroApps({
    excludeInstalling = false,
    includeInternal = false
  } = {}): MicroApp[] {
    let apps = kernel.bootstrapData.microApps;
    if (excludeInstalling) {
      apps = apps.filter(
        app => !(app.installStatus && app.installStatus === "running")
      );
    }
    if (!includeInternal) {
      apps = apps.filter(app => !app.internal);
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

  getAllUserInfo(): UserInfo[] {
    return kernel.allUserInfo;
  }

  getAllUserMap(): Map<string, UserInfo> {
    return kernel.allUserMap;
  }

  /**
   * 切换主体内容 `filter: blur(...)`;
   * @deprecated
   * @param blur
   */
  toggleFilterOfBlur(blur: boolean): void {
    document.body.classList.toggle("filter-of-blur", blur);
  }

  toggleLaunchpadEffect(open: boolean): void {
    document.body.classList.toggle("launchpad-open", open);
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

  getBrandSettings(): Record<string, string> {
    return Object.assign(
      { base_title: "DevOps 管理专家" },
      kernel.bootstrapData.settings && kernel.bootstrapData.settings.brand
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

  registerBrickTemplate(name: string, factory: BrickTemplateFactory): void {
    registerBrickTemplate(name, factory);
  }
}
