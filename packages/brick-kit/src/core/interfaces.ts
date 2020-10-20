import {
  CustomTemplateConstructor,
  FeatureFlags,
  MicroApp,
} from "@easyops/brick-types";
import { MicroAppModels } from "@sdk/micro-app-sdk";
import { CustomProcessorFunc } from "./exports";

/** @internal */
export type RelatedApp = MicroAppModels.ModelObjectMicroApp;

/** @internal */
export interface VisitedWorkspace {
  appId: string;
  appName: string;
  appLocaleName: string;
  url: string;
}

/** @internal */
export interface RecentApps {
  currentApp?: MicroApp;
  previousApp?: MicroApp;
  previousWorkspace?: VisitedWorkspace;
}

/** @internal */
export type RouterState = "initial" | "ready-to-mount" | "mounted";

/** @internal */
export interface RedirectConf {
  redirect?: string;
}

/** @internal */
export interface CustomApiOrchestration {
  name: string;
  namespace: string;
  contract?: {
    endpoint: {
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
    response?: {
      wrapper?: boolean;
      [key: string]: any;
    };
    [key: string]: any;
  };
  config?: Record<string, any>;
  type?: "emal" | "swagger";
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
   * 获取特性开关字典。
   *
   * @example
   *
   * ```ts
   * import { getRuntime } from "@easyops/brick-kit";
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
   * import { getRuntime } from "@easyops/brick-kit";
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
   * Get site's base path, generally will be `/next/` or `/`.
   *
   * @returns Site's base path.
   */
  getBasePath(): string;
}

/** 查询微应用列表时的选项。 */
export interface GetMicroAppsOptions {
  /** 是否排除正在安装的微应用。 */
  excludeInstalling?: boolean;

  /** 是否包括标记为不在 Launchpad 中显示的微应用。 */
  includeInternal?: boolean;
}
