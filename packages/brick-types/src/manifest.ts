import { LocationDescriptor } from "history";
import { SidebarMenu, MenuIcon } from "./menu";
import { PluginHistoryState } from "./runtime";

/** @internal */
export interface BootstrapData {
  brickPackages: BrickPackage[];
  templatePackages: TemplatePackage[];
  navbar: NavbarConf;
  storyboards: Storyboard[];
  settings: Settings;
  desktops: DesktopData[];
}

/** @internal */
export interface RuntimeBootstrapData extends BootstrapData {
  storyboards: RuntimeStoryboard[];
  microApps: MicroApp[];
}

/** @internal */
export interface Settings {
  featureFlags: FeatureFlags;
  homepage: string;
  [key: string]: unknown;
}

/**
 * 特性开关字典。
 *
 * @example
 *
 * ```json
 * {
 *   "next-builder-dynamic-menu": true
 * }
 * ```
 */
export type FeatureFlags = Record<string, boolean>;

/**
 * 微应用基本信息。
 */
export interface MicroApp {
  /**
   * 应用名称。
   */
  name: string;

  /**
   * 应用唯一 ID，应使用 `lower-kebab-case` 格式。
   */
  id: string;

  /**
   * 应用主页地址，如 `/search`。
   */
  homepage: string;

  /**
   * 应用图标配置。
   *
   * @remarks
   *
   * 图标地址相对于应用所在目录，也可以使用 `http://` 或 `https://` 开头的完整 URL。
   *
   * @example
   *
   * ```yaml
   * icons:
   *   large: "icons/large.png"
   * ```
   *
   * @example
   *
   * ```yaml
   * icons:
   *   large: "http://your.domain/your-icon.png"
   * ```
   */
  icons?: {
    large: string;
  };

  /**
   * 应用图标在 Launchpad 中显示的背景形状。
   */
  iconBackground?: "circle" | "square";

  /**
   * 标记为内部的应用不会出现在 Launchpad 中。
   */
  internal?: boolean;

  /**
   * 标记为私有的应用不会出现在应用商店中。
   */
  private?: boolean;

  /**
   * 应用的安装状态。
   */
  installStatus?: "ok" | "running";

  /**
   * 应用状态。
   *
   * @remarks
   *
   * 标记为 `developing` 或 `disabled` 的应用不会出现在 Launchpad 中。
   */
  status?: "developing" | "enabled" | "disabled";

  /**
   * 应用是否是 iframe 嵌套老 console 的模式。
   */
  legacy?: "iframe";

  /**
   * 应用在菜单中显示的图标。
   */
  menuIcon?: MenuIcon;

  /**
   * 应用的默认配置，在开发环境由应用开发者维护。
   */
  defaultConfig?: Record<string, unknown>;

  /**
   * 应用的用户配置，在运行环境由用户维护。
   */
  userConfig?: Record<string, unknown>;

  /**
   * 合并后的应用配置（运行时得出）。
   */
  config?: Record<string, unknown>;

  /** {@inheritDoc AppLocales} */
  locales?: AppLocales;

  /**
   * 本地化后的应用名称（运行时得出），本地化获取失败时回退到 `name`。
   */
  localeName?: string;

  /**
   * 路由别名映射（运行时得出）。
   *
   * @internal
   */
  $$routeAliasMap?: RouteAliasMap;
}

/**
 * 应用的基本信息的本地化配置。
 *
 * @example
 *
 * ```yaml
 * zh:
 *   name: 搜索
 * en:
 *   name: Search
 * ```
 */
export type AppLocales = Record<string, AppLocale>;

/**
 * 应用的单个地域的本地化配置。
 */
export interface AppLocale {
  /**
   * 对某地域显示的应用名称。
   */
  name?: string;
}

/** @internal */
export type RouteAliasMap = Map<string, RouteAliasConf>;

/** @internal */
export type RouteAliasConf = Pick<RouteConf, "path" | "alias">;

/** @internal */
export interface BrickPackage {
  filePath: string;
  bricks: string[];
  processors?: string[];
  dll?: string[];
}

/** @internal */
export interface TemplatePackage {
  templates: string[];
  filePath: string;
}

/** @internal */
export interface AuthInfo {
  org?: number;
  username?: string;
  userInstanceId?: string;
  loginFrom?: string;
}

/** @internal */
export interface NavbarConf {
  menuBar: string;
  appBar: string;
  loadingBar: string;
}

/**
 * 应用的 Storyboard 配置。
 */
export interface Storyboard {
  /** {@inheritDoc MicroApp} */
  app: MicroApp;

  /** @internal */
  imports?: string[];

  /**
   * 路由配置列表。
   */
  routes?: RouteConf[];

  /**
   * @deprecated 不再推荐使用。
   * @internal
   */
  dependsAll?: boolean;

  /** {@inheritDoc StoryboardMeta} */
  meta?: StoryboardMeta;
}

/** @internal */
export interface RuntimeStoryboard extends Storyboard {
  $$depsProcessed?: boolean;
  $$registerCustomTemplateProcessed?: boolean;
  $$fulfilled?: boolean;
}

/**
 * 路由配置，类型可以是构件列表、子路由列表和重定向中的一种。
 */
export type RouteConf =
  | RouteConfOfBricks
  | RouteConfOfRoutes
  | RouteConfOfRedirect;

/**
 * 包含一组构件的路由配置。
 */
export interface RouteConfOfBricks extends BaseRouteConf {
  type?: "bricks";

  /** 构件列表。 */
  bricks: BrickConf[];
}

/**
 * 包含一组子路由的路由配置。
 */
export interface RouteConfOfRoutes extends BaseRouteConf {
  type: "routes";

  /** 子路由列表。 */
  routes: RouteConf[];
}

/**
 * 使用重定向的路由配置。
 */
export interface RouteConfOfRedirect extends BaseRouteConf {
  type?: "redirect";

  /** 重定向的目标地址或异步数据处理配置。 */
  redirect: string | ResolveConf;
}

/**
 * 路由的基本配置信息。
 */
export interface BaseRouteConf {
  /**
   * 路由地址，通常应使用 `${APP.homepage}` 开头。
   */
  path: string;

  /**
   * 路由别名，它同时有路由唯一 ID 的作用，应保障在微应用内的唯一性。
   */
  alias?: string;

  /**
   * 是否精确匹配（未设置时系统默认会匹配路由地址及其所有子目录地址）。
   */
  exact?: boolean;

  /**
   * 标记为公开的路由不需要登录就能进入。
   */
  public?: boolean;

  /** {@inheritDoc MenuConf} */
  menu?: MenuConf;

  /**
   * 标记为混合的路由，将转换 `legacy: iframe` 模式。例如对于标记了 `legacy: iframe` 的应用，
   * 其中 `hybrid: true` 的路由将使用普通模式渲染页面；而对于其它应用，其中 `hybrid: true`
   * 的路由将使用 iframe 模式渲染页面。
   */
  hybrid?: boolean;

  /**
   * 提前声明可供路由内使用的 Provider 列表。
   *
   * @deprecated 请使用 `useProvider`，而无须提前声明 `providers`。
   */
  providers?: ProviderConf[];

  /**
   * 预定义的异步数据处理配置列表。
   */
  defineResolves?: DefineResolveConf[];

  /**
   * 要重定向的地址或异步处理配置。
   */
  redirect?: string | ResolveConf;

  /** {@inheritDoc SeguesConf} */
  segues?: SeguesConf;

  /**
   * 上下文配置列表。
   */
  context?: ContextConf[];
}

/**
 * 上下文配置
 *
 * @remarks
 *
 * 上下文类似于编程语言中的*变量*的概念，提前声明，按需赋值或修改，然后在需要的地方读取它。
 *
 * @example
 *
 * 定义方式一（自由变量）：
 *
 * ```yaml
 * context:
 *   - name: myContext
 *     # 初始 `value` 可以使用占位符。
 *     value:
 *       quality: good
 *
 *   # 初始 `value` 是可选的。
 *   - name: myAnotherContext
 * ```
 *
 * 定义方式二（异步 Resolve 的自由变量）：
 *
 * ```yaml
 * context:
 *   - name: myAsyncContext
 *     resolve:
 *       useProvider: my.any-provider
 *       # 默认将使用 Provider 返回的数据作为该 Context 的值（brick_next >= 1.25.2 支持）。
 *       # 如果需要转换数据，注意需使用 transform 后的 value 值。
 *       transform:
 *         # `CTX.myAsyncContext` 的值将是 `DATA.hostname`。
 *         value: '<% DATA.hostname %>'
 * ```
 *
 * 定义方式三（绑定构件属性）：
 *
 * ```yaml
 * bricks:
 *   - brick: my.source-brick
 *     context:
 *       - name: myContextRelatedToProp
 *         # 绑定构件属性的方式实际存储的是引用关系，在消费时实时获取。
 *         property: sourceProp
 * ```
 */
export interface ContextConf {
  /**
   * 上下文名称。
   */
  name: string;

  /**
   * 自由变量类型的上下文的值。
   */
  value?: unknown;

  /**
   * 异步处理配置。如需 transform，将使用转换后的结果的 `value` 字段作为值。
   */
  resolve?: ResolveConf;

  /**
   * 要绑定的构件属性名。
   */
  property?: string;
}

/**
 * 页面切换配置表。
 *
 * @remarks
 *
 * 可以用于组织视图之间的访问关系。在 Next Builder 中可以在 Routes Graph 页面显示该关系。
 *
 * @example
 *
 * ```yaml
 * go-to-list:
 *   target: product-list
 * go-to-detail:
 *   target: product-detail
 * ```
 */
export interface SeguesConf {
  [segueId: string]: SegueConf;
}

/**
 * 页面切换配置。
 */
export interface SegueConf {
  /**
   * 目标路由的别名。
   */
  target: string;
}

/**
 * 构件配置。
 */
export interface BrickConf {
  /**
   * 构件名。
   */
  brick?: string;

  /**
   * {@inheritDoc SlotsConf}
   */
  slots?: SlotsConf;

  /**
   * @deprecated 系统默认 `injectDeep: true`。
   * @internal
   */
  injectDeep?: boolean;

  /**
   * 构件属性。
   */
  properties?: Record<string, unknown>;

  /**
   * {@inheritDoc BrickEventsMap}
   */
  events?: BrickEventsMap;

  /**
   * 是否将构件放置到一个不可见的背景容器中，它们通常为 Provider 构件。
   */
  bg?: boolean;

  /**
   * {@inheritDoc BrickLifeCycle}
   */
  lifeCycle?: BrickLifeCycle;

  /**
   * @deprecated 系统现在会自动扫描内部使用的构件。
   * @internal
   */
  internalUsedBricks?: string[];

  /**
   * @deprecated 系统现在会自动扫描内部使用的（老）模板。
   * @internal
   */
  internalUsedTemplates?: string[];

  /**
   * （老）模板。
   *
   * @deprecated 建议使用{@link CustomTemplate | 自定义模板}代替。
   */
  template?: string;

  /**
   * （老）模板的参数表。
   *
   * @deprecated 建议使用{@link CustomTemplate | 自定义模板}代替。
   */
  params?: Record<string, unknown>;

  /**
   * 条件渲染配置，根据 `if` 的计算结果来决定是否渲染该构件。
   *
   * @injectable
   */
  if?: string | boolean | ResolveConf;

  /**
   * 标记 `portal: true` 的构件将被放置到一个“{@link https://reactjs.org/docs/portals.html | 传送门}”容器中，它们通常为
   * *Modal*、*Drawer* 等弹窗容器类型的构件。
   */
  portal?: boolean;

  /**
   * {@inheritDoc BaseRouteConf.context}
   */
  context?: ContextConf[];

  /**
   * 将构件的属性导出到上下文。
   *
   * @deprecated 请使用 `context` 并指定 `property` 来声明一个上下文变量绑定到构件属性。
   * @internal
   */
  exports?: Record<string, string>;
}

/**
 * Provider 配置。
 *
 * @deprecated 推荐使用 `useProvider` 结合 `context`。
 */
export type ProviderConf =
  | string
  | Pick<BrickConf, "brick" | "properties" | "events" | "lifeCycle">;

/** @internal */
export interface RuntimeBrickConf extends BrickConf {
  $$dynamic?: boolean;
  $$resolved?: boolean;
  $$template?: string;
  $$params?: Record<string, unknown>;
  $$lifeCycle?: BrickLifeCycle;
  $$if?: string | boolean | ResolveConf;
}

/** @internal */
export interface MessageConf {
  channel: string;
  handlers: BrickEventHandler | BrickEventHandler[];
}

/**
 * 构件生命周期配置。
 *
 * @remarks
 *
 * 构件在自身渲染和页面渲染的各个时刻可以执行相关的动作。
 *
 * 其生命周期包含的阶段及其顺序如下：
 *
 * 当页面进入时：
 *
 * 1. `useResolves`
 *
 * 2. `onPageLoad`
 *
 * 3. `onAnchorLoad` or `onAnchorUnload`
 *
 * 当页面离开时：
 *
 * 1. `onBeforePageLeave`
 *
 * 2. `onPageLeave`
 */
export interface BrickLifeCycle {
  /**
   * 定义在构件装载前需要进行的异步数据处理，计算结果将作为属性表赋值给构件。
   */
  useResolves?: ResolveConf[];

  /**
   * 定义构件在页面加载完成后的动作。
   */
  onPageLoad?: BrickEventHandler | BrickEventHandler[];

  /** @internal */
  onPageLeave?: BrickEventHandler | BrickEventHandler[];

  /**
   * 定义构件在页面离开前要执行的动作。
   */
  onBeforePageLeave?: BrickEventHandler | BrickEventHandler[];

  /**
   * 定义构件在页面渲染完成后，当页面 URL 中包含非空的 anchor（URL hash 去掉前缀 #）时，需要处理的动作。
   */
  onAnchorLoad?: BrickEventHandler | BrickEventHandler[];

  /**
   * 定义构件在页面渲染完成后，当页面 URL 中不包含非空的 anchor（URL hash 去掉前缀 #）时，需要处理的动作。
   */
  onAnchorUnload?: BrickEventHandler | BrickEventHandler[];

  /** @internal */
  onMessage?: MessageConf | MessageConf[];

  /** @internal */
  onMessageClose?: BrickEventHandler | BrickEventHandler[];
}

/**
 * 异步数据处理配置。
 */
export type ResolveConf = EntityResolveConf | RefResolveConf;

/**
 * 实体类的异步数据处理配置。
 */
export type EntityResolveConf =
  | UseProviderResolveConf
  | SelectorProviderResolveConf;

/**
 * 使用 `useProvider` 的异步数据处理配置。
 */
export interface UseProviderResolveConf extends BaseEntityResolveConf {
  /** 指定要使用的构件名。 */
  useProvider: string;
}

/**
 * 使用 CSS selector 指定 Provider 的异步数据处理配置。
 */
export interface SelectorProviderResolveConf extends BaseEntityResolveConf {
  /** Provider 构件的 CSS selector。 */
  provider: string;
}

/**
 * 实体类的异步数据处理的基本配置信息。
 */
export interface BaseEntityResolveConf {
  /** 将要执行的构件的方法名，默认为 `resolve`。 */
  method?: string;

  /**
   * 需要传递给 `method` 的参数列表。
   *
   * @injectable
   */
  args?: unknown[];

  /**
   * 使用返回数据的指定字段作为数据源。
   *
   * @deprecated 建议统一使用 `transformFrom`。
   */
  field?: string | string[];

  /**
   * 将数据源直接赋值给指定的这个属性。
   *
   * @deprecated 建议统一使用 `transform`。
   */
  name?: string;

  /**
   * 使用返回数据的指定字段作为数据源。
   */
  transformFrom?: string | string[];

  /**
   * 设置在数据转换中对数组的映射处理模式。
   */
  transformMapArray?: boolean | "auto";

  /** {@inheritDoc GeneralTransform} */
  transform?: GeneralTransform;

  /** {@inheritDoc HandleReject} */
  onReject?: HandleReject;
  if?: string | boolean;
}

/**
 * 预定义的异步数据处理配置。
 */
export type DefineResolveConf = (
  | Omit<UseProviderResolveConf, "name" | "onReject">
  | Omit<SelectorProviderResolveConf, "name" | "onReject">
) & {
  /**
   * 预定义的异步处理 ID。
   */
  id: string;
};

/**
 * 引用类的异步数据处理配置。
 */
export type RefResolveConf = Pick<
  BaseEntityResolveConf,
  | "name"
  | "transformFrom"
  | "transformMapArray"
  | "transform"
  | "onReject"
  | "if"
> & {
  /** 设置要引用的预定义的异步数据处理 ID */
  ref: string;
};

/** {@inheritDoc HandleRejectByTransform} */
export type HandleReject = HandleRejectByTransform /*| HandleRejectByCatch*/;

/**
 * 当异步数据处理抛出错误时，使用该错误对象作为数据源进行转换来作为最终结果。
 */
export interface HandleRejectByTransform {
  /** {@inheritDoc GeneralTransform} */
  transform: GeneralTransform;
}

// export interface HandleRejectByCatch {
//   catch: true;
// }

/**
 * 数据转换配置。
 */
export type GeneralTransform = string | TransformMap | TransformItem[];

/**
 * 数据转换表。
 */
export interface TransformMap {
  [propName: string]: unknown;
}

/**
 * 数据转换项。
 */
export interface TransformItem {
  from?: string | string[];
  to: string | TransformMap;
  mapArray?: boolean | "auto";
}

/**
 * 菜单配置。
 */
export type MenuConf = false | StaticMenuConf | BrickMenuConf | ResolveMenuConf;

/**
 * 静态菜单配置。
 */
export interface StaticMenuConf extends StaticMenuProps {
  type?: "static";
}

/**
 * 静态菜单配置信息。
 */
export interface StaticMenuProps {
  /** 页面标题（显示在浏览器标签栏）。 */
  pageTitle?: string;

  /** {@inheritDoc SidebarMenu} */
  sidebarMenu?: SidebarMenu;

  /** 引用的菜单 ID。 */
  menuId?: string;

  /** 引用的二级菜单 ID。 */
  subMenuId?: string;

  /** {@inheritDoc BreadcrumbConf} */
  breadcrumb?: BreadcrumbConf;

  /**
   * 是否对 `pageTitle`, `sidebarMenu`, `breadcrumb` 进行深层递归的参数注入。
   *
   * @internal
   * @deprecated 系统现在默认 `injectDeep: true`
   */
  injectDeep?: boolean;
}

/**
 * 面包屑配置。
 *
 * @remarks
 *
 * 每一层路由都可以按需配置零个、一个或多个面包屑，系统将组合这些面包屑显示在页面顶栏中。
 *
 * 通过 `overwrite` 指定是否覆盖上层路由已有的面包屑列表（默认为追加模式）。
 *
 * 注意系统将始终在面包屑起始位置显示当前应用的名字。
 *
 * @example
 *
 * ```yaml
 * routes:
 *   - path: "${APP.homepage}/products"
 *     menu:
 *       breadcrumb:
 *         items:
 *           text: "Products"
 *           to: "${APP.homepage}/products"
 *     bricks:
 *       - brick: "your.brick"
 *         slots:
 *           content:
 *             type: "routes"
 *             routes:
 *               - path: "${APP.homepage}/products/:productId"
 *                 menu:
 *                   breadcrumb:
 *                     items:
 *                       text: "Product Detail"
 *                       to: "${APP.homepage}/products/${productId}"
 * ```
 *
 * 在页面 `/products` 将显示 `Your App > Products` 面包屑。
 *
 * 而在页面 `/products/:productId` 将显示 `Your App > Products > Product Detail` 面包屑。
 */
export interface BreadcrumbConf {
  /**
   * 面包屑列表。
   */
  items: BreadcrumbItemConf[];

  /**
   * 是否覆盖上层路由已有的面包屑列表（默认为追加模式）。
   */
  overwrite?: boolean;
}

/**
 * 面包屑单项配置。
 */
export interface BreadcrumbItemConf {
  /** 面包屑文本。 */
  text: string;

  /** 面包屑对应的链接。 */
  to?: LocationDescriptor<PluginHistoryState>;
}

/**
 * 使用构件做数据代理的菜单配置。
 */
export interface BrickMenuConf {
  type: "brick";

  /** 构件名。 */
  brick: string;

  /**
   * @deprecated 系统默认 `injectDeep: true`。
   * @internal
   */
  injectDeep?: boolean;

  /** {@inheritDoc BrickConf.properties} */
  properties?: Record<string, unknown>;

  /** {@inheritDoc BrickEventsMap} */
  events?: BrickEventsMap;

  /** {@inheritDoc BrickLifeCycle} */
  lifeCycle?: BrickLifeCycle;
}

/**
 * 使用异步数据处理的菜单配置。
 */
export interface ResolveMenuConf {
  type: "resolve";

  /** {@inheritDoc ResolveConf} */
  resolve: ResolveConf;
}

/**
 * 插槽配置表。
 *
 * @remarks
 *
 * 对于容器类构件，会有特定的插槽以供插入子构件，容器构件通常会对这些插槽内的子构件有不同的布局及交互处理。
 *
 * `slots` 为 key-value 键值对配置，其中 key 为插槽名称，value 为插槽配置。
 *
 * 每个插槽配置有两种模式：构件列表和路由列表。
 * 对于构件列表，容器将直接插入这些子构件。
 * 而对于路由构件，系统将根据路由匹配进行渲染。
 *
 * @example
 *
 * ```yaml
 * brick: "basic-bricks.micro-view"
 * slots:
 *   toolbar:
 *     type: "bricks"
 *     bricks: ...
 *   content:
 *     type: "routes"
 *     routes: ...
 * ```
 */
export interface SlotsConf {
  [slotName: string]: SlotConf;
}

/** 插槽配置。 */
export type SlotConf = SlotConfOfBricks | SlotConfOfRoutes;

/** 使用一组构件的插槽配置。 */
export interface SlotConfOfBricks {
  type: "bricks";

  /** 在插槽中插入的构件列表。 */
  bricks: BrickConf[];
}

/** 使用一组子路由的插槽配置。 */
export interface SlotConfOfRoutes {
  type: "routes";

  /** 在插槽中插入的子路由列表。 */
  routes: RouteConf[];
}

/** @internal */
export interface SlotsConfOfBricks {
  [slotName: string]: SlotConfOfBricks;
}

/** @internal */
export type SlotType = "bricks" | "routes";

/**
 * 构件的事件配置表。
 *
 * @remarks
 *
 * 事件配置表中，键为事件名，值为单个或多个事件处理器配置。
 */
export interface BrickEventsMap {
  [key: string]: BrickEventHandler | BrickEventHandler[];
}

/**
 * 事件处理器配置。
 */
export type BrickEventHandler =
  | BuiltinBrickEventHandler
  | UseProviderEventHandler
  | CustomBrickEventHandler;

/** 系统内置的事件处理器。 */
export interface BuiltinBrickEventHandler {
  /** 处理动作名。 */
  action: // Third Party History
  | "history.push"
    | "history.replace"
    | "history.goBack"
    | "history.goForward"

    // Extended History
    | "history.reload"
    | "history.pushQuery"
    | "history.replaceQuery"
    | "history.pushAnchor"
    // | "history.replaceAnchor"

    // Overridden History
    | "history.block"
    | "history.unblock"

    // Segues
    | "segue.push"
    | "segue.replace"

    // Alias
    | "alias.push"
    | "alias.replace"

    // Iframe
    | "legacy.go"

    // Browser method
    | "location.reload"
    | "location.assign"
    | "window.open"
    | "event.preventDefault"
    | "console.log"
    | "console.error"
    | "console.warn"
    | "console.info"

    // Antd message
    | "message.success"
    | "message.error"
    | "message.info"
    | "message.warn"

    // `handleHttpError`
    | "handleHttpError"

    // Storyboard context
    | "context.assign"
    | "context.replace"

    // Find related tpl and dispatch event.
    | "tpl.dispatchEvent"

    // Websocket event
    | "message.subscribe"
    | "message.unsubscribe";

  /** 传递的参数列表 */
  args?: unknown[];

  /**
   * 根据条件决定是否执行该动作。
   */
  if?: string | boolean;

  /** {@inheritDoc BrickEventHandlerCallback} */
  callback?: BrickEventHandlerCallback;
}

/**
 * 使用 Provider 构件进行事件处理的配置。
 */
export interface UseProviderEventHandler {
  /** {@inheritDoc UseProviderResolveConf.useProvider} */
  useProvider: string;

  /** {@inheritDoc BuiltinBrickEventHandler.args} */
  args?: unknown[];

  /** {@inheritDoc BrickEventHandlerCallback} */
  callback?: BrickEventHandlerCallback;

  /** {@inheritDoc BuiltinBrickEventHandler.if} */
  if?: string | boolean;
}

/**
 * 使用指定构件进行事件处理的基本配置。
 */
export interface BaseCustomBrickEventHandler {
  /**
   * 指定目标构件的 CSS selector。
   */
  target?: string | unknown;

  /**
   * 在自定义模板中指定 ref 对应的构件。
   */
  targetRef?: string;

  /**
   * 是否使用 `target` 匹配多个构件。
   */
  multiple?: boolean;

  /** {@inheritDoc BuiltinBrickEventHandler.if} */
  if?: string | boolean;
}

/**
 * 执行指定构件的指定方法的事件处理配置。
 */
export interface ExecuteCustomBrickEventHandler
  extends BaseCustomBrickEventHandler {
  /** 指定的方法名。 */
  method: string;

  /** 传递的参数列表，默认为事件对象。 */
  args?: unknown[];

  /** {@inheritDoc BrickEventHandlerCallback} */
  callback?: BrickEventHandlerCallback;
}

/**
 * 事件处理回调。
 *
 * @remarks
 *
 * 事件处理过程将当做异步函数看待，当成功、失败时分别执行 `success` 和 `error` 动作，
 * 无论成功与否，最终再执行 `finally` 动作。
 */
export interface BrickEventHandlerCallback {
  /**
   * 事件处理执行成功时要执行的动作。为后续动作传递的事件的 `detail` 为该执行结果。
   */
  success?: BrickEventHandler | BrickEventHandler[];

  /**
   * 事件处理执行失败时要执行的动作。为后续动作传递的事件的 `detail` 为该错误对象。
   */
  error?: BrickEventHandler | BrickEventHandler[];

  /**
   * 事件处理执行后，无论成功与否，要执行的动作。
   */
  finally?: BrickEventHandler | BrickEventHandler[];
}

/**
 * 设置指定构件的指定属性的事件处理配置。
 */
export interface SetPropsCustomBrickEventHandler
  extends BaseCustomBrickEventHandler {
  /**
   * 要设置的属性表。
   */
  properties: Record<string, unknown>;

  /**
   * @deprecated 系统默认 `injectDeep: true`。
   * @internal
   */
  injectDeep?: boolean;
}

/** 使用指定构件进行事件处理的配置。 */
export type CustomBrickEventHandler =
  | ExecuteCustomBrickEventHandler
  | SetPropsCustomBrickEventHandler;

/** @internal */
export interface DesktopData {
  items: DesktopItem[];
  name?: string;
}

/** @internal */
export type DesktopItem = DesktopItemApp | DesktopItemDir | DesktopItemCustom;

/** @internal */
export interface DesktopItemApp {
  type: "app";
  id: string;
  app?: MicroApp;
}

/** @internal */
export interface DesktopItemDir {
  type: "dir";
  id: string;
  name: string;
  items: (DesktopItemApp | DesktopItemCustom)[];
}

/** @internal */
export interface DesktopItemCustom {
  type: "custom";
  id: string;
  name: string;
  url: string;
}

/** 使用 `useBrick` 自行渲染子构件的配置。 */
export type UseBrickConf = UseSingleBrickConf | UseSingleBrickConf[];

/** 使用 `useBrick` 自行渲染子构件的配置（单个）。 */
export interface UseSingleBrickConf {
  /** 构件名。 */
  brick: string;

  /** {@inheritDoc BrickConf.properties} */
  properties?: Record<string, unknown>;

  /** {@inheritDoc BrickConf.events} */
  events?: BrickEventsMap;

  /**
   * 构件生命周期配置。在 `useBrick` 中仅支持 `useResolves`。
   */
  lifeCycle?: Pick<BrickLifeCycle, "useResolves">;

  /** {@inheritDoc BaseEntityResolveConf.transformFrom} */
  transformFrom?: string | string[];

  /** {@inheritDoc BaseEntityResolveConf.transform} */
  transform?: GeneralTransform;

  /** {@inheritDoc BrickConf.if} */
  if?: string | boolean | ResolveConf;

  /** {@inheritDoc UseBrickSlotsConf} */
  slots?: UseBrickSlotsConf;
}

/** 在 `useBrick` 中使用的插槽配置表。 */
export interface UseBrickSlotsConf {
  [slotName: string]: UseBrickSlotConf;
}

/** 在 `useBrick` 中使用的插槽配置。 */
export interface UseBrickSlotConf {
  type?: "bricks";

  /** 子构件列表。 */
  bricks: UseSingleBrickConf[];
}

/**
 * 应用的 Storyboard 元信息（包括自定义模板和国际化配置）。
 */
export interface StoryboardMeta {
  /** 应用定义的自定义模板列表。 */
  customTemplates?: CustomTemplate[];

  /** {@inheritDoc MetaI18n} */
  i18n?: MetaI18n;
}

/**
 * 应用定义的国际化配置表。
 *
 * @example
 *
 * ```yaml
 * zh:
 *   SEARCH: 搜索
 *   PLEASE_INPUT_KEYWORDS: 请输入关键字。
 * en:
 *   SEARCH: Search
 *   PLEASE_INPUT_KEYWORDS: Please input keywords.
 * ```
 */
export type MetaI18n = Record<string, Record<string, string>>;

/**
 * 自定义模板配置。
 */
export interface CustomTemplate {
  /** 自定义模板的名称。 */
  name: string;

  /** 自定义模板渲染的构件配置列表。 */
  bricks: BrickConfInTemplate[];

  /** {@inheritDoc CustomTemplateProxy} */
  proxy?: CustomTemplateProxy;
}

/**
 * 自定义模板构造声明。
 */
export type CustomTemplateConstructor = Omit<CustomTemplate, "name">;

/** 自定义模板渲染的构件配置。 */
export type BrickConfInTemplate = Omit<
  BrickConf,
  "brick" | "slots" | "template" | "params"
> & {
  /** 构件名。 */
  brick: string;

  /** 用于在自定义模板内部引用的 ID。 */
  ref?: string;

  /** {@inheritDoc SlotsConfInTemplate} */
  slots?: SlotsConfInTemplate;
};

/**
 * 自定义模板中的构件的插槽配置表。
 *
 * @remarks
 *
 * 配置表中的键为插槽名，值为插槽配置。
 */
export interface SlotsConfInTemplate {
  [slotName: string]: SlotConfInTemplate;
}

/** 自定义模板中的构件的插槽配置。 */
export interface SlotConfInTemplate {
  type: "bricks";

  /** 在插槽中插入的子构件列表。 */
  bricks: BrickConfInTemplate[];
}

/**
 * 自定义模板的代理配置。
 */
export interface CustomTemplateProxy {
  /** {@inheritDoc CustomTemplateProxyProperties} */
  properties?: CustomTemplateProxyProperties;

  /** {@inheritDoc CustomTemplateProxyEvents} */
  events?: CustomTemplateProxyEvents;

  /** {@inheritDoc CustomTemplateProxySlots} */
  slots?: CustomTemplateProxySlots;

  /** {@inheritDoc CustomTemplateProxyMethods} */
  methods?: CustomTemplateProxyMethods;
}

/**
 * 自定义模板的属性代理配置表。
 *
 * @remarks
 *
 * 配置表中的键为自定义模板对外的属性名，值为代理配置。
 */
export interface CustomTemplateProxyProperties {
  [name: string]: CustomTemplateProxyProperty;
}

/** 自定义模板的属性代理配置。 */
export type CustomTemplateProxyProperty =
  | CustomTemplateProxyBasicProperty
  | CustomTemplateProxyTransformableProperty;

/** 自定义模板的基本属性代理配置。 */
export interface CustomTemplateProxyBasicProperty {
  /** 要代理的构件的引用 ID。 */
  ref: string;

  /** 要代理的构件的属性名 */
  refProperty: string;
}

/** 自定义模板的可转换的属性代理配置。 */
export interface CustomTemplateProxyTransformableProperty {
  /** {@inheritDoc CustomTemplateProxyBasicProperty.ref} */
  ref: string;

  /** 要代理的构件的属性转换设置。 */
  refTransform: GeneralTransform;
}

/**
 * 自定义模板的事件代理配置表。
 *
 * @remarks
 *
 * 配置表中的键为自定义模板对外的事件类型名，值为代理配置。
 */
export interface CustomTemplateProxyEvents {
  [name: string]: CustomTemplateProxyEvent;
}

/**
 * 自定义模板的事件代理配置。
 */
export interface CustomTemplateProxyEvent {
  /** {@inheritDoc CustomTemplateProxyBasicProperty.ref} */
  ref: string;

  /** 要代理的事件类型名。 */
  refEvent: string;
}

/**
 * 自定义模板的插槽代理配置表。
 *
 * @remarks
 *
 * 配置表中的键为自定义模板对外的插槽名，值为代理配置。
 */
export interface CustomTemplateProxySlots {
  [name: string]: CustomTemplateProxySlot;
}

/**
 * 自定义模板的插槽代理配置。
 */
export interface CustomTemplateProxySlot {
  /** {@inheritDoc CustomTemplateProxyBasicProperty.ref} */
  ref: string;

  /** 要代理的插槽名。 */
  refSlot: string;

  /** 自定义模板的外部声明的子构件将被放置到插槽中的索引位置。 */
  refPosition?: number;
}

/**
 * 自定义模板的方法代理配置表。
 *
 * @remarks
 *
 * 配置表中的键为自定义模板对外的方法名，值为代理配置。
 */
export interface CustomTemplateProxyMethods {
  [name: string]: CustomTemplateProxyMethod;
}

/**
 * 自定义模板的方法代理配置。
 */
export interface CustomTemplateProxyMethod {
  /** {@inheritDoc CustomTemplateProxyBasicProperty.ref} */
  ref: string;

  /** 要代理的方法名。 */
  refMethod: string;
}

/** @internal */
export interface RefForProxy {
  brick?: ProbablyRuntimeBrick;
}

/** @internal */
export interface ProbablyRuntimeBrick {
  element?: HTMLElement;
}
