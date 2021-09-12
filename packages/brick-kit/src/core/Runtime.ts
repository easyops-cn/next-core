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
  SiteMapItem,
  SidebarMenu,
} from "@next-core/brick-types";
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
  CustomApiDefinition,
  AbstractRuntime,
} from "./interfaces";
import { getBasePath } from "../internal/getBasePath";
import { getCurrentMode, getCurrentTheme } from "../themeAndMode";
import { processMenu } from "../internal/menu";
import { registerLazyBricks } from "./LazyBrickRegistry";
import { CustomTemplateContext } from "./CustomTemplates";

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

/* istanbul ignore next */
export function _dev_only_loadEditorBricks(
  editorBricks: string[]
): Promise<void> {
  return kernel.loadEditorBricks(editorBricks);
}

/* istanbul ignore next */
export function _dev_only_getFakeKernel(
  overrides?: Record<string, unknown>
): Kernel {
  return {
    bootstrapData: kernel.bootstrapData,
    getFeatureFlags: kernel.getFeatureFlags.bind(kernel),
    loadDynamicBricksInBrickConf:
      kernel.loadDynamicBricksInBrickConf.bind(kernel),
    getProviderBrick: kernel.getProviderBrick.bind(kernel),
    ...overrides,
  } as Kernel;
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
      apps = apps.filter((app) => app.installStatus !== "running");
    }
    if (!includeInternal) {
      apps = apps.filter((app) => !app.internal);
    }
    return apps;
  }

  hasInstalledApp(appId: string): boolean {
    return kernel.bootstrapData.microApps.some(
      (app) => app.id === appId && app.installStatus !== "running"
    );
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
  getLaunchpadSiteMap(): SiteMapItem[] {
    return kernel.bootstrapData.siteSort || [];
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
    kernel.loadUsersAsync();
    return kernel.allUserMapPromise;
  }

  /* istanbul ignore next */
  getMagicBrickConfigMapAsync(): Promise<Map<string, MagicBrickConfig>> {
    kernel.loadMagicBrickConfigAsync();
    return kernel.allMagicBrickConfigMapPromise;
  }

  /* istanbul ignore next */
  fetchMenu(menuId: string): Promise<SidebarMenu> {
    return processMenu(menuId, kernel.router.getCurrentContext(), kernel);
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
  registerLazyBricks = registerLazyBricks;

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

  getBasePath = getBasePath;
  getCurrentTheme = getCurrentTheme;
  getCurrentMode = getCurrentMode;

  applyPageTitle(pageTitle: string): void {
    const baseTitle = this.getBrandSettings().base_title;
    document.title = pageTitle ? `${pageTitle} - ${baseTitle}` : baseTitle;
  }
}

/* istanbul ignore next */
export function _internalApiGetResolver(): Resolver {
  if (process.env.NODE_ENV === "test") {
    return { resolve: () => Promise.resolve() } as any;
  }
  return kernel.router.getResolver();
}

/* istanbul ignore next */
export function _internalApiGetRouterState(): RouterState {
  if (process.env.NODE_ENV === "test") {
    return "mounted";
  }
  return kernel.router.getState();
}

/* istanbul ignore next */
export function _internalApiGetRouterRenderId(): string {
  if (process.env.NODE_ENV === "test") {
    return "render-id-1";
  }
  return kernel.router.getRenderId();
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
export function _internalApiGetTplContext(): CustomTemplateContext {
  if (process.env.NODE_ENV === "test") {
    return {} as any;
  }
  return kernel.router.getTplContext();
}

/* istanbul ignore next */
export function _internalApiGetProviderBrick(
  provider: string
): Promise<HTMLElement> {
  return kernel.getProviderBrick(provider);
}

/* istanbul ignore next */
export function _internalApiGetMicroAppApiOrchestrationMap(): Promise<
  Map<string, CustomApiDefinition>
> {
  return kernel.allMicroAppApiOrchestrationPromise;
}

/* istanbul ignore next */
export function _internalApiLoadDynamicBricksInBrickConf(
  brickConf: BrickConf
): Promise<void> {
  return kernel.loadDynamicBricksInBrickConf(brickConf);
}
