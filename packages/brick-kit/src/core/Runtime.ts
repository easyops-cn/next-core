import { cloneDeep } from "lodash";
import { asyncProcessBrick } from "@next-core/brick-utils";
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
  RouteConf,
  CustomTemplate,
  RuntimeStoryboard,
  StoryConf,
  RuntimeBrickConf,
  SiteTheme,
} from "@next-core/brick-types";
import { compare, type CompareOperator } from "compare-versions";
import {
  Kernel,
  MenuBar,
  AppBar,
  Resolver,
  registerCustomTemplate,
  registerCustomProcessor,
  NavConfig,
  mountTree,
  afterMountTree,
  unmountTree,
  MountableElement,
} from "./exports";
import { httpErrorToString } from "../handleHttpError";
import { brickTemplateRegistry } from "./TemplateRegistries";
import { createRuntime, getRuntime } from "../runtime";
import { registerBrickTemplate } from "./TemplateRegistries";
import {
  RouterState,
  RecentApps,
  CustomApiDefinition,
  AbstractRuntime,
} from "./interfaces";
import { getBasePath } from "../internal/getBasePath";
import { getCurrentMode, getCurrentTheme } from "../themeAndMode";
import { processMenu } from "../internal/menu";
import { registerLazyBricks } from "./LazyBrickRegistry";
import { registerWidgetFunctions } from "./WidgetFunctions";
import { registerWidgetI18n } from "./WidgetI18n";
import { StoryboardContextWrapper } from "./StoryboardContext";
import { getCustomTemplateContext } from "./CustomTemplates/CustomTemplateContext";
import { FormDataProperties } from "./CustomForms/ExpandCustomForm";
import { matchStoryboard } from "./matchStoryboard";

let kernel: Kernel;

/* istanbul ignore next */
export function _dev_only_getBrickPackages(): BrickPackage[] {
  // eslint-disable-next-line no-console
  console.warn(
    "`_dev_only_getBrickPackages()` is deprecated and will always return an empty array, please use `(await BootstrapV2Api_brickPackageInfo()).bricks` instead"
  );
  return kernel.bootstrapData.brickPackages;
}

/* istanbul ignore next */
export function _dev_only_getTemplatePackages(): TemplatePackage[] {
  // eslint-disable-next-line no-console
  console.warn(
    "`_dev_only_getTemplatePackages()` is deprecated and will always return an empty array, please use `(await BootstrapV2Api_brickPackageInfo()).templates` instead"
  );
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
    loadDynamicBricks: kernel.loadDynamicBricks.bind(kernel),
    getProviderBrick: kernel.getProviderBrick.bind(kernel),
    ...overrides,
  } as Kernel;
}

/* istanbul ignore next */
export function _dev_only_updateStoryboard(
  appId: string,
  storyboardPatch: Partial<Storyboard>
): void {
  kernel._dev_only_updateStoryboard(appId, storyboardPatch);
}

/* istanbul ignore next */
export function _dev_only_updateTemplatePreviewSettings(
  appId: string,
  templateId: string,
  settings: unknown
): void {
  kernel._dev_only_updateTemplatePreviewSettings(appId, templateId, settings);
}

/* istanbul ignore next */
export function _dev_only_updateSnippetPreviewSettings(
  appId: string,
  snippetData: {
    snippetId: string;
    bricks: BrickConf[];
  }
): void {
  kernel._dev_only_updateSnippetPreviewSettings(appId, snippetData);
}

/* istanbul ignore next */
export function _dev_only_updateStoryboardByRoute(
  appId: string,
  newRoute: RouteConf
): void {
  kernel._dev_only_updateStoryboardByRoute(appId, newRoute);
}

export function _dev_only_updateStoryboardByTemplate(
  appId: string,
  newTemplate: CustomTemplate,
  settings?: unknown
): void {
  kernel._dev_only_updateStoryboardByTemplate(appId, newTemplate, settings);
}

export function _dev_only_updateStoryboardBySnippet(
  appId: string,
  newSnippet: {
    snippetId: string;
    bricks: BrickConf[];
  }
): void {
  kernel._dev_only_updateStoryboardBySnippet(appId, newSnippet);
}

/* istanbul ignore next */
export function _dev_only_getContextValue(name: string): unknown {
  return kernel.router.getStoryboardContextWrapper().getValue(name);
}

/* istanbul ignore next */
export function _dev_only_getStateValue(
  name: string,
  { tplContextId }: Record<string, any>
): unknown {
  const tplContext = getCustomTemplateContext(tplContextId);

  return tplContext.state.getValue(name);
}

/* istanbul ignore next */
export function _dev_only_updateFormPreviewSettings(
  appId: string,
  formId: string,
  settings: FormDataProperties
): void {
  kernel._dev_only_updateFormPreviewSettings(appId, formId, settings);
}

export async function _dev_only_render(
  mountPoints: MountPoints,
  conf: StoryConf
): Promise<void> {
  unmountTree(mountPoints.bg as MountableElement);

  if (!getRuntime()) {
    const runtime = createRuntime();
    await runtime.bootstrap(mountPoints);
  }

  if (kernel.router?.getResolver()) {
    kernel.router.getResolver().resetRefreshQueue();
  }

  const mountRoutesResult: any = {
    main: [],
    portal: [],
    failed: false,
  };

  try {
    const mutableConf = cloneDeep(conf) as RuntimeBrickConf;
    await asyncProcessBrick(
      mutableConf,
      brickTemplateRegistry,
      kernel.bootstrapData.templatePackages
    );
    await kernel.loadDynamicBricksInBrickConf(mutableConf);
    await kernel.router.getMountBrick(mutableConf, null, "", mountRoutesResult);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);

    mountRoutesResult.failed = true;
    mountRoutesResult.main = [
      {
        type: "basic-bricks.page-error",
        properties: {
          error: httpErrorToString(error),
        },
        events: {},
      },
    ];
    mountRoutesResult.portal = [];
  }

  const { main, failed, portal } = mountRoutesResult;

  mountTree(main, mountPoints.main as MountableElement);
  mountTree(portal, mountPoints.portal as MountableElement);

  afterMountTree(main);
  afterMountTree(portal);

  if (!failed) {
    kernel.router.getHandlePageLoad();
    kernel.router.getResolver().scheduleRefreshing();
  }
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

  /* istanbul ignore next */
  getCurrentRoute(): RouteConf {
    return kernel.currentRoute;
  }

  /* istanbul ignore next */
  getNavConfig(): NavConfig {
    return kernel.router.getNavConfig();
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

  hasInstalledApp(appId: string, matchVersion?: string): boolean {
    const allMicroApps = window.STANDALONE_MICRO_APPS
      ? kernel.bootstrapData.offSiteStandaloneApps
      : kernel.bootstrapData.microApps;
    return allMicroApps.some((app) => {
      const foundApp = app.id === appId && app.installStatus !== "running";
      if (!matchVersion || !foundApp) {
        return foundApp;
      }
      // Valid `matchVersion`:
      //   >=1.2.3
      //   >1.2.3
      //   =1.2.3
      //   <=1.2.3
      //   <1.2.3
      const matches = matchVersion.match(/^([><]=?|=)(.*)$/);
      try {
        if (!matches) {
          throw new TypeError(`Invalid match version: ${matchVersion}`);
        }
        return compare(
          app.currentVersion,
          matches[2],
          matches[1] as CompareOperator
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
      return false;
    });
  }

  reloadMicroApps(interceptorParams?: InterceptorParams): Promise<void> {
    return kernel.reloadMicroApps(
      {
        check_login: true,
      },
      interceptorParams
    );
  }

  /* istanbul ignore next */
  reloadSharedData(): void {
    // Drop supports for related apps;
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
      kernel.bootstrapData.settings?.brand,
      kernel.getOriginFaviconHref()
        ? { favicon: kernel.getOriginFaviconHref() }
        : {}
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
    return Object.assign(
      {},
      kernel.bootstrapData.settings?.misc,
      (kernel.nextApp?.config?.settings as any)?.misc
    );
  }

  registerBrickTemplate = registerBrickTemplate;
  registerCustomTemplate = registerCustomTemplate;
  registerCustomProcessor = registerCustomProcessor;
  registerLazyBricks = registerLazyBricks;
  registerWidgetFunctions = registerWidgetFunctions;
  registerWidgetI18n = registerWidgetI18n;

  /* istanbul ignore next */
  getRelatedApps(appId: string): unknown[] {
    return [];
  }

  /* istanbul ignore next */
  getRelatedAppsAsync(appId: string): Promise<unknown[]> {
    // eslint-disable-next-line no-console
    console.warn(
      "`getRuntime().getRelatedAppsAsync()` is deprecated and will always resolve with an empty array"
    );
    return Promise.resolve([]);
  }

  /* istanbul ignore next */
  popWorkspaceStack(): void {
    // deprecated
  }

  /* istanbul ignore next */
  resetWorkspaceStack(): void {
    // deprecated
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
export function _internalApiGetStoryboardContextWrapper(): StoryboardContextWrapper {
  return kernel.router.getStoryboardContextWrapper();
}

/* istanbul ignore next */
export function _internalApiGetCurrentContext(): PluginRuntimeContext {
  if (process.env.NODE_ENV === "test") {
    return {} as any;
  }
  return kernel.router.getCurrentContext();
}

/* istanbul ignore next */
export function _internalApiMatchStoryboard(
  pathname: string
): RuntimeStoryboard {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  return matchStoryboard(kernel.bootstrapData.storyboards, pathname);
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
