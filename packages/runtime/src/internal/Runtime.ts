import type {
  RuntimeStoryboard,
  BootstrapSettings,
  FeatureFlags,
  BootstrapData,
  Contract,
  Storyboard,
  BrickConf,
  RouteConf,
  ResolveConf,
  BrickPackage,
} from "@next-core/types";
import { i18n, initializeI18n } from "@next-core/i18n";
import { loadBricksImperatively } from "@next-core/loader";
import { deepFreeze, isObject } from "@next-core/utils/general";
import type { PermissionApi_validatePermissions } from "@next-api-sdk/micro-app-sdk";
import moment from "moment";
import "moment/locale/zh-cn.js";
import { createHistory } from "../history.js";
import { matchStoryboard } from "./matchStoryboard.js";
import { Router } from "./Router.js";
import { NS, locales } from "./i18n.js";
import { loadNotificationService } from "../Notification.js";
import { loadDialogService } from "../Dialog.js";
import { injectedBrickPackages } from "./injected.js";
import { type AppForCheck, hasInstalledApp } from "./hasInstalledApp.js";
import type { RuntimeContext } from "./interfaces.js";
import { listenDevtoolsEagerly } from "./devtools.js";
import { getV2RuntimeFromDll } from "../getV2RuntimeFromDll.js";
import { ThemeSettings, customizeColorTheme } from "./customizeColorTheme.js";

let runtime: Runtime;

// Allow inject bootstrap data in a runtime other than Brick Next.
let bootstrapData: BootstrapData | undefined;
let router: Router | undefined;
let processedBrickPackages: BrickPackage[] | undefined;

export interface RuntimeOptions {
  hooks?: RuntimeHooks;
}

export interface ImagesFactory {
  get(name: string): string;
}

export interface PageViewInfo {
  status: "ok" | "failed" | "redirected" | "not-found";
  path?: string;
  pageTitle?: string;
}

export interface RuntimeHooks {
  auth?: {
    getAuth(): object;
    isLoggedIn(): boolean;
    authenticate?(...args: unknown[]): unknown;
    logout?(...args: unknown[]): unknown;
  };
  fulfilStoryboard?: (storyboard: RuntimeStoryboard) => Promise<void>;
  validatePermissions?: typeof PermissionApi_validatePermissions;
  checkPermissions?: {
    checkPermissions(...actions: string[]): boolean;
    preCheckPermissions(storyboard: Storyboard): Promise<void> | undefined;
    preCheckPermissionsForBrickOrRoute(
      container: BrickConf | RouteConf,
      asyncComputeRealValue: (value: unknown) => Promise<unknown>
    ): Promise<void> | undefined;
  };
  checkInstalledApps?: {
    preCheckInstalledApps(
      storyboard: Storyboard,
      hasAppInBootstrap: (appId: string) => boolean
    ): void;
    waitForCheckingApps(appIds: string[]): Promise<void>;
    getCheckedApp(appId: string): AppForCheck | undefined;
  };
  flowApi?: {
    FLOW_API_PROVIDER: string;
    registerFlowApiProvider(): void;
    isFlowApiProvider(provider: string): boolean;
    getArgsOfFlowApi(
      provider: string,
      originalArgs: unknown[],
      method?: string,
      stream?: boolean
    ): Promise<unknown[]>;
    collectContract(contracts: Contract[] | undefined): void;
    collectWidgetContract(contracts: Contract[] | undefined): void;
    clearCollectWidgetContract(): void;
  };
  menu?: {
    getMenuById(menuId: string): unknown;
    fetchMenuById(
      menuId: string,
      runtimeContext: RuntimeContext,
      runtimeHelpers: RuntimeHooksMenuHelpers
    ): Promise<unknown>;
  };
  images?: {
    imagesFactory(
      appId: string,
      isBuildPush?: boolean,
      version?: string
    ): ImagesFactory;
    widgetImagesFactory(
      widgetId: string,
      widgetVersion?: string
    ): ImagesFactory;
  };
  messageDispatcher?: {
    subscribe(...args: unknown[]): Promise<unknown>;
    unsubscribe(...args: unknown[]): Promise<unknown>;
    onMessage(channel: string, listener: (data: unknown) => void): void;
    onClose(listener: () => void): void;
    reset(): void;
  };
  pageView?: {
    create(): (info: PageViewInfo) => void;
  };
}

export interface RuntimeHooksMenuHelpers {
  getStoryboardByAppId(appId: string): Storyboard | undefined;
  resolveData(
    resolveConf: ResolveConf,
    runtimeContext: RuntimeContext
  ): Promise<unknown>;
  asyncComputeRealValue(
    value: unknown,
    runtimeContext: RuntimeContext,
    options?: { ignoreSymbols?: boolean; noInject?: boolean }
  ): Promise<unknown>;
}

export let hooks: RuntimeHooks | undefined;

export function createRuntime(options?: RuntimeOptions) {
  if (runtime) {
    throw new Error("Cannot create multiple runtimes");
  }
  listenDevtoolsEagerly();
  hooks = options?.hooks;
  initializeI18n(NS, locales);
  moment.locale(i18n.language);
  i18n.on("languageChanged", () => {
    moment.locale(i18n.language);
  });
  createHistory();
  runtime = new Runtime();
  return runtime;
}

function getRuntimeV3() {
  return runtime;
}

// istanbul ignore next
function getRuntimeV2Factory() {
  const v2Kit = getV2RuntimeFromDll();
  if (v2Kit) {
    return function getRuntimeV2() {
      return new Proxy(v2Kit.getRuntime(), {
        get(...args) {
          const key = args[1];
          switch (key) {
            case "getCurrentApp":
            case "getRecentApps":
            case "hasInstalledApp":
            case "getDesktops":
            case "getLaunchpadSettings":
            case "getLaunchpadSiteMap":
            case "toggleLaunchpadEffect":
            case "applyPageTitle":
            case "getNavConfig":
            case "getFeatureFlags":
            case "getMiscSettings":
            case "getBrandSettings":
              return Reflect.get(...args);
          }
        },
      }) as unknown as Runtime;
    };
  }
}

// istanbul ignore next
export const getRuntime = getRuntimeV2Factory() || getRuntimeV3;

export class Runtime {
  #initialized = false;
  #bootstrapped = false;

  readonly version: number | undefined = 3;

  initialize(data: BootstrapData) {
    if (this.#initialized) {
      throw new Error("The runtime cannot be initialized more than once");
    }
    this.#initialized = true;
    normalizeBootstrapData(data);
    bootstrapData = data;
    const { notification, dialog } = this.#getPresetBricks();
    if (notification !== false) {
      loadNotificationService(
        notification ?? "basic.show-notification",
        this.loadBricks
      );
    }
    if (dialog !== false) {
      loadDialogService(dialog ?? "basic.show-dialog", this.loadBricks);
    }
    customizeColorTheme(data.settings?.misc?.theme as ThemeSettings);
  }

  async bootstrap(data?: BootstrapData) {
    if (data) {
      this.initialize(data);
    }
    if (this.#bootstrapped) {
      throw new Error("The runtime cannot be bootstrapped more than once");
    }
    this.#bootstrapped = true;
    router = new Router(bootstrapData!.storyboards!);
    await router.bootstrap();
  }

  getRecentApps() {
    return router?.getRecentApps() ?? {};
  }

  getCurrentApp() {
    return router?.getRecentApps().currentApp;
  }

  hasInstalledApp(appId: string, matchVersion?: string): boolean {
    return hasInstalledApp(appId, matchVersion);
  }

  getFeatureFlags(): FeatureFlags {
    return {
      ...bootstrapData?.settings?.featureFlags,
      ...(
        router?.getRecentApps().currentApp?.config
          ?.settings as BootstrapSettings
      )?.featureFlags,
      "migrate-to-brick-next-v3": true,
    };
  }

  getMiscSettings() {
    return {
      ...bootstrapData?.settings?.misc,
      ...(
        router?.getRecentApps().currentApp?.config
          ?.settings as BootstrapSettings
      )?.misc,
    };
  }

  getBrandSettings(): Record<string, string> {
    return {
      base_title: "DevOps 管理专家",
      ...(bootstrapData?.settings?.brand as Record<string, string>),
    };
  }

  getLaunchpadSettings() {
    return {
      columns: 7,
      rows: 4,
      ...bootstrapData?.settings?.launchpad,
    };
  }

  getDesktops(): unknown[] {
    return bootstrapData?.desktops ?? [];
  }

  getLaunchpadSiteMap(): unknown[] {
    return bootstrapData?.siteSort ?? [];
  }

  toggleLaunchpadEffect(open: boolean): void {
    document.body.classList.toggle("launchpad-open", open);
  }

  applyPageTitle(pageTitle: string): void {
    const baseTitle = this.getBrandSettings().base_title;
    document.title = pageTitle
      ? (router?.getRecentApps().currentApp?.localeTitle as string) ||
        `${pageTitle} - ${baseTitle}`
      : baseTitle;
  }

  getNavConfig() {
    return router?.getNavConfig();
  }

  loadBricks(bricks: string[] | Set<string>) {
    return loadBricksImperatively(bricks, getBrickPackages());
  }

  #getPresetBricks() {
    return (bootstrapData?.settings?.presetBricks ?? {}) as {
      notification?: string | false;
      dialog?: string | false;
    };
  }
}

function normalizeBootstrapData(data: BootstrapData) {
  if (isObject(data.settings)) {
    deepFreeze(data.settings);
  }
  if (data.brickPackages) {
    deepFreeze(data.brickPackages);
  }
}

function processPublicDepsPackages(
  brickPackages: BrickPackage[],
  pubDeps: BrickPackage[] | undefined
): BrickPackage[] {
  if (!pubDeps?.length) return brickPackages;

  const bricksMap = new Map();

  // bootstrapData 数据和 pubDeps 中可能同时存在同一个包名，需要过滤去重， 以 pubDeps 中的包为准
  [...pubDeps, ...brickPackages].forEach((pkg) => {
    const pkgName = pkg.filePath.split("/")[1];
    // 始终将 pubDeps 放在前面
    if (!bricksMap.has(pkgName)) {
      bricksMap.set(pkgName, pkg);
    }
  });

  return Array.from(bricksMap.values());
}

export function getBrickPackages(): BrickPackage[] {
  return (
    // Not necessary to process brick packages multiple times.
    processedBrickPackages ??
    (processedBrickPackages = processPublicDepsPackages(
      bootstrapData?.brickPackages ??
        injectedBrickPackages ??
        (window.STANDALONE_BRICK_PACKAGES as BrickPackage[] | undefined) ??
        [],
      window.PUBLIC_DEPS as BrickPackage[] | undefined
    ))
  );
}

export function _internalApiGetRenderId(): string | undefined {
  return router?.getRenderId();
}

export function _internalApiMatchStoryboard(
  pathname: string
): RuntimeStoryboard | undefined {
  return matchStoryboard(bootstrapData?.storyboards ?? [], pathname);
}

export function _internalApiGetRuntimeContext() {
  return router?.getRuntimeContext();
}

export function _internalApiGetStoryboardInBootstrapData(appId: string) {
  return bootstrapData?.storyboards?.find(
    (storyboard) => storyboard.app.id === appId
  );
}

export function _internalApiGetAppInBootstrapData(appId: string) {
  return _internalApiGetStoryboardInBootstrapData(appId)?.app;
}

export let _test_only_setBootstrapData: (data: BootstrapData) => void;

// istanbul ignore next
if (process.env.NODE_ENV === "test") {
  _test_only_setBootstrapData = (data) => {
    bootstrapData = data as BootstrapData;
  };
}
