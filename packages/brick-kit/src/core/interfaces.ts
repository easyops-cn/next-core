import {
  CustomTemplateConstructor,
  FeatureFlags,
  MicroApp,
  SidebarMenu,
  SiteMode,
  SiteTheme,
  ExtField,
  ContractRequest,
  ContractResponse,
} from "@next-core/brick-types";
import {
  ColorThemeOptionsByBrand,
  ColorThemeOptionsByBaseColors,
  ColorThemeOptionsByVariables,
} from "../internal/applyColorTheme";
import { CustomProcessorFunc } from "./exports";
import { LazyBrickImportFunction } from "./LazyBrickRegistry";

/** @internal */
export interface RecentApps {
  currentApp?: MicroApp;
  previousApp?: MicroApp;
}

/** @internal */
export type RouterState = "initial" | "ready-to-mount" | "mounted";

/** @internal */
export interface RedirectConf {
  redirect?: string;
}

/** @internal */
export interface CustomApiDefinition {
  name: string;
  namespace: string;
  version?: string;
  serviceName?: string;
  contract?: {
    endpoint: {
      ext_fields?: ExtField[];
      uri: string;
      method:
        | "POST"
        | "post"
        | "PUT"
        | "put"
        | "GET"
        | "get"
        | "DELETE"
        | "delete"
        | "LIST"
        | "list"
        | "PATCH"
        | "patch"
        | "HEAD"
        | "head";
    };
    request?: ContractRequest;
    response?: ContractResponse;
  };
}

/** @internal */
export interface CustomApiProfile {
  uri: string;
  method: string;
  name: string;
  namespace: string;
  serviceName?: string;
  responseWrapper: boolean;
  version?: string;
  isFileType?: boolean;
  ext_fields: ExtField[];
  request?: ContractRequest;
}

/**
 * 系统运行时对象（抽象类型）。
 */
export interface AbstractRuntime {
  /**
   * 获得当前所在的微应用信息。
   */
  getCurrentApp(): MicroApp;

  /**
   * 获取微应用列表。
   *
   * @param options - 查询选项。
   */
  getMicroApps(options?: GetMicroAppsOptions): MicroApp[];

  /**
   * 查看是否已安装某应用。
   */
  hasInstalledApp(appId: string, matchVersion?: string): boolean;

  /**
   * 获取特性开关字典。
   *
   * @example
   *
   * ```ts
   * import { getRuntime } from "@next-core/brick-kit";
   *
   * const flags = getRuntime().getFeatureFlags();
   * // {
   * //   "your-feature": true,
   * //   ...
   * // }
   * ```
   */
  getFeatureFlags(): FeatureFlags;

  /**
   * 获取杂项配置。
   *
   * @remarks
   *
   * 类似于特性开关，但可以配置普通字符串、数字等其它类型的值。
   *
   * @example
   *
   * ```ts
   * import { getRuntime } from "@next-core/brick-kit";
   *
   * const misc = getRuntime().getMiscSettings();
   * // {
   * //   defaultTableColumns: 5,
   * //   webhookUrl: "http://localhost/",
   * //   ...
   * // }
   * ```
   */
  getMiscSettings(): Record<string, unknown>;

  /**
   * 注册一个自定义模板。
   *
   * @param tplName - 模板名。
   * @param tplConstructor - 模板构造器。
   * @param appId - 模板所属应用的 ID。
   */
  registerCustomTemplate(
    tplName: string,
    tplConstructor: CustomTemplateConstructor,
    appId?: string
  ): void;

  /**
   * 注册一个自定义加工函数。
   *
   * @param processorFullName - 自定义加工函数名。
   * @param processorFunc - 自定义加工函数。
   */
  registerCustomProcessor(
    processorFullName: string,
    processorFunc: CustomProcessorFunc
  ): void;

  /**
   * 注册懒加载的构件。
   *
   * @param bricks - 一个或多个构件。
   * @param factory - 动态加载函数（`import()` 调用）。
   */
  registerLazyBricks(
    bricks: string | string[],
    factory: LazyBrickImportFunction
  ): void;

  /**
   * Get site's base path, generally will be `/next/` or `/`.
   *
   * @returns Site's base path.
   */
  getBasePath(): string;

  /**
   * Get site's current theme.
   *
   * @returns Current theme.
   */
  getCurrentTheme(): SiteTheme;

  /**
   * Get Site's current mode.
   *
   * @returns Current mode.
   */
  getCurrentMode(): SiteMode;

  /**
   * Fetch menu by ID.
   *
   * @param menuId - The menu ID.
   *
   * @returns The menu data.
   */
  fetchMenu(menuId: string): Promise<SidebarMenu>;

  /**
   * Apply the page title in browser.
   *
   * @param pageTitle - The page title.
   */
  applyPageTitle(pageTitle: string): void;
}

/** 查询微应用列表时的选项。 */
export interface GetMicroAppsOptions {
  /** 是否排除正在安装的微应用。 */
  excludeInstalling?: boolean;

  /** 是否包括标记为不在 Launchpad 中显示的微应用。 */
  includeInternal?: boolean;
}
export interface ThemeSetting {
  brandColor: Omit<ColorThemeOptionsByBrand, "type">;
  baseColors: Omit<ColorThemeOptionsByBaseColors, "type">;
  variables: Omit<ColorThemeOptionsByVariables, "type">;
}

export interface DataValueOption {
  tplContextId?: string;
}
