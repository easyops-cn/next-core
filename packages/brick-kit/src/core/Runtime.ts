import {
  MountPoints,
  MicroApp,
  InterceptorParams,
  FeatureFlags,
  DesktopData,
  UserInfo,
  BrickPackage,
  Storyboard,
  MagicBrickConfig,
  PluginRuntimeContext,
  BrickConf,
  TemplatePackage,
} from "@easyops/brick-types";
import {
  Kernel,
  MenuBar,
  AppBar,
  Resolver,
  registerCustomTemplate,
  registerCustomProcessor,
} from "./exports";
import { registerBrickTemplate } from "./TemplateRegistries";
import {
  RelatedApp,
  RouterState,
  RecentApps,
  CustomApiOrchestration,
  AbstractRuntime,
} from "./interfaces";

let kernel: Kernel;

/* istanbul ignore next */
export function _dev_only_getBrickPackages(): BrickPackage[] {
  return kernel.bootstrapData.brickPackages;
}

/* istanbul ignore next */
export function _dev_only_getTemplatePackages(): TemplatePackage[] {
  return kernel.bootstrapData.templatePackages;
}

/* istanbul ignore next */
export function _dev_only_getStoryboards(): Storyboard[] {
  // Deprecated since the storyboards are probably not fulfilled.
  return [];
}

/* istanbul ignore next */
export function _dev_only_loadDynamicBricksInBrickConf(
  brickConf: BrickConf
): Promise<void> {
  return kernel.loadDynamicBricksInBrickConf(brickConf);
}

export class Runtime implements AbstractRuntime {
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

  /* istanbul ignore next */
  getCurrentApp(): MicroApp {
    return kernel.currentApp;
  }

  /* istanbul ignore next */
  getRecentApps(): RecentApps {
    return kernel.getRecentApps();
  }

  getMicroApps({
    excludeInstalling = false,
    includeInternal = false,
  } = {}): MicroApp[] {
    let apps = kernel.bootstrapData.microApps;
    if (excludeInstalling) {
      apps = apps.filter(
        (app) => !(app.installStatus && app.installStatus === "running")
      );
    }
    if (!includeInternal) {
      apps = apps.filter((app) => !app.internal);
    }
    return apps;
  }

  reloadMicroApps(interceptorParams?: InterceptorParams): Promise<void> {
    return kernel.loadMicroApps(
      {
        check_login: true,
      },
      interceptorParams
    );
  }

  /* istanbul ignore next */
  reloadSharedData(): void {
    return kernel.loadSharedData();
  }

  /* istanbul ignore next */
  getDesktops(): DesktopData[] {
    return kernel.bootstrapData.desktops || [];
  }

  /* istanbul ignore next */
  getAllUserInfo(): UserInfo[] {
    // eslint-disable-next-line no-console
    console.warn(
      "`getRuntime().getAllUserInfo()` is deprecated and will always return an empty array, please use `await getRuntime().getAllUserMapAsync()` instead"
    );
    return [];
  }

  /* istanbul ignore next */
  getAllUserMap(): Map<string, UserInfo> {
    // eslint-disable-next-line no-console
    console.warn(
      "`getRuntime().getAllUserMap()` is deprecated and will always return an empty Map, please use `await getRuntime().getAllUserMapAsync()` instead"
    );
    return new Map();
  }

  /* istanbul ignore next */
  getAllUserMapAsync(): Promise<Map<string, UserInfo>> {
    return kernel.allUserMapPromise;
  }

  /* istanbul ignore next */
  getMagicBrickConfigMapAsync(): Promise<Map<string, MagicBrickConfig>> {
    return kernel.allMagicBrickConfigMapPromise;
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

  /* istanbul ignore next */
  getFeatureFlags(): FeatureFlags {
    return kernel.getFeatureFlags();
  }

  getHomepage(): string {
    return kernel.bootstrapData.settings?.homepage ?? "/";
  }

  getBrandSettings(): Record<string, string> {
    return Object.assign(
      { base_title: "DevOps 管理专家" },
      kernel.bootstrapData.settings?.brand
    );
  }

  getLaunchpadSettings(): { columns: number; rows: number } {
    return Object.assign(
      {
        columns: 7,
        rows: 4,
      },
      kernel.bootstrapData.settings?.launchpad
    );
  }

  getMiscSettings(): Record<string, unknown> {
    return Object.assign({}, kernel.bootstrapData.settings?.misc);
  }

  registerBrickTemplate = registerBrickTemplate;
  registerCustomTemplate = registerCustomTemplate;
  registerCustomProcessor = registerCustomProcessor;

  /* istanbul ignore next */
  getRelatedApps(appId: string): RelatedApp[] {
    // eslint-disable-next-line no-console
    console.warn(
      "`getRuntime().getRelatedApps()` is deprecated and will always return an empty array, please use `await getRuntime().getRelatedAppsAsync()` instead"
    );
    return [];
  }

  /* istanbul ignore next */
  getRelatedAppsAsync(appId: string): Promise<RelatedApp[]> {
    return kernel.getRelatedAppsAsync(appId);
  }

  /* istanbul ignore next */
  popWorkspaceStack(): void {
    return kernel.popWorkspaceStack();
  }

  /* istanbul ignore next */
  resetWorkspaceStack(): void {
    kernel.workspaceStack = [];
  }
}

/* istanbul ignore next */
export function _internalApiGetResolver(): Resolver {
  return kernel.router.getResolver();
}

/* istanbul ignore next */
export function _internalApiGetRouterState(): RouterState {
  return kernel.router.getState();
}

/* istanbul ignore next */
export function _internalApiMessageCloseHandler(event: CloseEvent): void {
  return kernel.router.handleMessageClose(event);
}

/* istanbul ignore next */
export function _internalApiGetCurrentContext(): PluginRuntimeContext {
  if (process.env.NODE_ENV === "test") {
    return {} as any;
  }
  return kernel.router.getCurrentContext();
}

/* istanbul ignore next */
export function _internalApiGetProviderBrick(
  provider: string
): Promise<HTMLElement> {
  return kernel.getProviderBrick(provider);
}

/* istanbul ignore next */
export function _internalApiGetMicroAppApiOrchestrationMap(): Promise<
  Map<string, CustomApiOrchestration>
> {
  return kernel.allMicroAppApiOrchestrationPromise;
}
