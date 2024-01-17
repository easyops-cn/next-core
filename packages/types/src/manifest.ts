/** @internal */
export interface BootstrapData {
  brickPackages?: BrickPackage[];
  storyboards?: Storyboard[];
  settings?: BootstrapSettings;
  desktops?: unknown[];
  siteSort?: unknown[];
}

/** @internal */
export interface BootstrapSettings {
  featureFlags?: FeatureFlags;
  homepage?: string;
  misc?: Record<string, unknown>;
  brand?: Record<string, string>;
  launchpad?: {
    columns?: number;
    rows?: number;
  };
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

  /** 应用当前版本。 */
  currentVersion?: string;

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
   * 标记为 `disabled` 的应用不会出现在 Launchpad 中。
   */
  status?: "developing" | "enabled" | "disabled";

  /**
   * 应用在菜单中显示的图标。
   */
  // menuIcon?: MenuIcon;
  menuIcon?: any;

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
   * 整个应用不启用登录守卫。
   */
  noAuthGuard?: boolean;

  /**
   * 表示该应用是否是来自 BuildAndPush 的。
   */
  isBuildPush?: boolean;

  /**
   * 路由别名映射（运行时得出）。
   *
   * @internal
   */
  $$routeAliasMap?: RouteAliasMap;

  /**
   * 面包屑配置
   */
  breadcrumb?: BreadcrumbConf;

  /**
   * 该应用所属主题， dark 已经被用大屏模式，这里使用 dark-v2
   */
  theme?: "light" | "dark-v2";

  /**
   * 该应用是否是独立打包应用
   */
  standaloneMode?: boolean;

  /**
   * UI 版本
   */
  uiVersion?: string;
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
  id: string;
  filePath: string;
  bricks: string[];
  processors: string[];
  /** For third-party bricks, there maybe no namespace. */
  elements?: string[];
  dependencies?: Record<string, string[]>;
}

/**
 * 应用的 Storyboard 配置。
 */
export interface Storyboard {
  /** {@inheritDoc MicroApp} */
  app: MicroApp;

  /**
   * 路由配置列表。
   */
  routes: RouteConf[];

  /** {@inheritDoc StoryboardMeta} */
  meta?: StoryboardMeta;

  /**
   * 该 app 请求 bootstrap json 的地址，仅针对是联合 app 时才有该字段
   */
  bootstrapFile?: string;
}

/** @internal */
export interface RuntimeStoryboard extends Storyboard {
  $$depsProcessed?: boolean;
  $$registerCustomTemplateProcessed?: boolean;
  $$fulfilled?: boolean;
  $$fulfilling?: Promise<void>;
  $$i18nFulfilled?: boolean;
  $$deadConditionsRemoved?: boolean;
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

  /** 是否启用子路由增量渲染。 */
  incrementalSubRoutes?: boolean;
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
  type: "redirect";

  /** 重定向的目标地址或异步数据处理配置。 */
  redirect: string | ResolveConf;
}

/**
 * 路由的基本配置信息。
 */
export interface BaseRouteConf {
  /**
   * 条件配置，根据 `if` 的计算结果来决定是否展示路由
   */
  if?: string | boolean;

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

  /** {@inheritDoc SeguesConf} */
  segues?: SeguesConf;

  /**
   * 上下文配置列表。
   */
  context?: ContextConf[];

  /**
   * 预校验的动态权限列表，在编排中可以通过 `<% PERMISSIONS.check("your-action") %>`来校验权限点。
   * 当被校验的权限点为已知字符串，则框架会扫描收集统一校验，不需要在此处声明；
   * 当被校验的权限点需要动态获得，例如通过 `QUERY`,`PATH`,`CTX` 等参数动态计算得到，则需要在 `permissionsPreCheck` 中提前声明。
   * 如果某个权限点需要在接口中获得，也只需要在 Context 中通过异步 Resolve 提前赋值给 Context 即可。
   */
  permissionsPreCheck?: string[];

  /**
   * 关联的文档 ID。
   */
  documentId?: string;

  /** 构件编排 ID */
  iid?: string;
}

/**
 * 上下文（数据）配置
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
   * 上下文（数据）名称。
   */
  name: string;

  /**
   * 自由变量类型的上下文的值。
   */
  value?: unknown;

  /**
   * 异步处理配置。如需 transform，将使用转换后的结果的 `value` 字段作为值。
   */
  resolve?: ContextResolveConf;

  /**
   * 要绑定的构件属性名。
   */
  // property?: string;

  /**
   * 条件配置，根据 `if` 的计算结果来决定是否启用该上下文。不适用于绑定构件属性的数据。
   */
  if?: string | boolean;

  /**
   * 是否自动跟踪自己依赖的上下文数据，当它们变化时自动计算获得新的值。
   */
  track?: boolean;

  /**
   * 当数据发生变化时触发的事件。注意，该事件仅适用于自由变量或异步处理的数据，不适用于绑定构件属性的数据。
   */
  onChange?: BrickEventHandler | BrickEventHandler[];

  /** 是否暴露为对应自定义模板的属性。 */
  expose?: boolean;
}

/**
 * 用于 Context 的异步数据处理配置。
 */
export type ContextResolveConf = ResolveConf & {
  /**
   * 启用异步加载时，系统会尽早发起请求，但不会阻塞页面继续渲染。
   *
   * 根据数据加载完成的时机，有两种情况：
   *   a) 数据在 mount 之前加载完成，则将统一在 mount 之后触发一次数据变更事件（设置了追踪标记的属性将会更新）
   *   b) 数据在 mount 之后加载完成，则在加载完成时立即触发一次数据变更事件（设置了追踪标记的属性将会更新）
   */
  async?: boolean;

  /**
   * 启用懒加载时，系统不再主动加载该异步数据（此时默认的 `value` 为 `null`），
   * 需要用户主动通过 `context.load` 或 `context.refresh` 触发。
   */
  lazy?: boolean;

  /**
   * 设置`lazy:true`时，需要用户主动设置 `trigger` 为 `ContextResolveTriggerBrickLifeCycle`中的一个或者多个生命周期，当触发生命周期时主动加载数据
   *
   */
  trigger?: ContextResolveTriggerBrickLifeCycle;
};

/**
 * Context 的异步数据处理配置为 `trigger` 时支持的生命周期
 */
export declare type ContextResolveTriggerBrickLifeCycle =
  | "onBeforePageLoad"
  | "onPageLoad"
  | "onBeforePageLeave"
  | "onPageLeave"
  | "onAnchorLoad"
  | "onAnchorUnload";

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
  brick: string;

  /**
   * {@inheritDoc SlotsConf}
   */
  slots?: SlotsConf;

  /** 子构件列表，优先级低于 `slots` */
  children?: BrickConf[];

  /** 当使用 children 而不是 slots 定义子构件时，子构件需要设置所属 slot */
  slot?: string;

  /**
   * 构件属性。
   */
  properties?: Record<string, unknown>;

  /**
   * {@inheritDoc BrickEventsMap}
   */
  events?: BrickEventsMap;

  /**
   * {@inheritDoc BrickLifeCycle}
   */
  lifeCycle?: BrickLifeCycle;

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
   * {@inheritDoc BaseRouteConf.permissionsPreCheck}
   */
  permissionsPreCheck?: string[];

  /** 构件编排 ID */
  iid?: string;

  /** 控制类节点的数据源 */
  dataSource?: unknown;
}

/** @internal */
export interface MessageConf {
  channel: string;
  handlers: BrickEventHandler | BrickEventHandler[];
}

/**
 *  `threshold`范围在[0,1], 默认0.1
 */
export interface ScrollIntoViewConf {
  threshold?: number;
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
 * 1. `onBeforePageLoad`
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
   * 定义构件在页面加载前要执行的动作。
   */
  onBeforePageLoad?: BrickEventHandler | BrickEventHandler[];

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

  /**
   * 定义构件在页面渲染完成后，当求值占位符的 MEDIA 全局对象改变时，需要处理的动作。
   */
  onMediaChange?: BrickEventHandler | BrickEventHandler[];

  /** @internal */
  onMessage?: MessageConf | MessageConf[];

  /** @internal */
  onMessageClose?: BrickEventHandler | BrickEventHandler[];

  /**
   * 定义构件与窗口视图交集大小超过阈值（threshold）规定的大小时候执行的动作
   */
  onScrollIntoView?: ScrollIntoViewConf;

  /**
   * 定义构件在挂载时的动作。
   */
  onMount?: BrickEventHandler | BrickEventHandler[];

  /**
   * 定义构件在卸载时的动作。
   */
  onUnmount?: BrickEventHandler | BrickEventHandler[];
}

/**
 * 异步数据处理配置。
 */
export type ResolveConf = UseProviderResolveConf;

/**
 * 使用 `useProvider` 的异步数据处理配置。
 */
export interface UseProviderResolveConf {
  /** 指定要使用的构件名。 */
  useProvider: string;

  /** 将要执行的构件的方法名，默认为 `resolve`。 */
  method?: string;

  /**
   * 需要传递给 `method` 的参数列表。
   *
   * @injectable
   */
  args?: unknown[];

  /** {@inheritDoc GeneralTransform} */
  transform?: GeneralTransform;

  /** {@inheritDoc HandleReject} */
  onReject?: HandleReject;

  /** {@inheritDoc BuiltinBrickEventHandler.if} */
  if?: string | boolean;
}

/** {@inheritDoc HandleRejectByTransform} */
export type HandleReject = HandleRejectByTransform;

/**
 * 当异步数据处理抛出错误时，使用该错误对象作为数据源进行转换来作为最终结果。
 */
export interface HandleRejectByTransform {
  /** {@inheritDoc GeneralTransform} */
  transform: unknown;
}

/**
 * 数据转换配置。
 */
export type GeneralTransform = unknown;

/**
 * 菜单配置。
 */
export type MenuConf = false | StaticMenuConf | ResolveMenuConf;

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
  // sidebarMenu?: SidebarMenu;
  sidebarMenu?: any;

  /** 引用的菜单 ID。 */
  menuId?: string;

  /** 引用的二级菜单 ID。 */
  subMenuId?: string;

  /** {@inheritDoc BreadcrumbConf} */
  breadcrumb?: BreadcrumbConf;
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

  /**
   * 是否显示当前AppName
   * */
  noCurrentApp?: boolean;

  /**
   * 使用当前菜单标题作为面包屑标题
   */
  useCurrentMenuTitle?: boolean;
}

/**
 * 面包屑单项配置。
 */
export interface BreadcrumbItemConf {
  /** 面包屑文本。 */
  text: string;

  /** 面包屑对应的链接。 */
  to?:
    | string
    | {
        pathname?: string;
        search?: string;
        hash?: string;
      };
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
  type?: "bricks";

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
  | CustomBrickEventHandler
  | ConditionalEventHandler;

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
    // | "segue.push"
    // | "segue.replace"

    // Alias
    // | "alias.push"
    // | "alias.replace"

    // localStorage
    | "localStorage.setItem"
    | "localStorage.removeItem"

    // sessionStorage
    | "sessionStorage.setItem"
    | "sessionStorage.removeItem"

    // Browser method
    | "location.reload"
    | "location.assign"
    | "window.open"
    | "window.close"
    | "event.preventDefault"
    | "event.stopPropagation"
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
    | "context.refresh"
    | "context.load"

    // Update template state
    | "state.update"
    | "state.refresh"
    | "state.load"

    // Find related tpl and dispatch event.
    | "tpl.dispatchEvent"

    // Websocket event
    | "message.subscribe"
    | "message.unsubscribe"

    // Theme and mode.
    | "theme.setDarkTheme"
    | "theme.setLightTheme"
    | "theme.setTheme"
    | "mode.setDashboardMode"
    | "mode.setDefaultMode"
    | "menu.clearMenuTitleCache"
    | "menu.clearMenuCache"
    | "preview.debug"

    // Analytics
    | "analytics.event"

    // Update form state
    | "formstate.update";

  /** 传递的参数列表 */
  args?: unknown[];

  /**
   * 根据条件决定是否执行该动作。
   */
  if?: string | boolean;

  /** 是否开启批量变更，默认为true */
  batch?: boolean;

  /** {@inheritDoc BrickEventHandlerCallback} */
  callback?: BrickEventHandlerCallback;

  /** {@inheritDoc ConditionalEventHandler.else} */
  else?: BrickEventHandler | BrickEventHandler[];
}

/**
 * 使用 Provider 构件进行事件处理的配置。
 */
export interface UseProviderEventHandler {
  /** {@inheritDoc UseProviderResolveConf.useProvider} */
  useProvider: string;

  method?: "resolve" | "saveAs";

  /** {@inheritDoc BuiltinBrickEventHandler.args} */
  args?: unknown[];

  /** {@inheritDoc BrickEventHandlerCallback} */
  callback?: BrickEventHandlerCallback;

  /** {@inheritDoc ProviderPollOptions} */
  poll?: ProviderPollOptions;

  /** {@inheritDoc BuiltinBrickEventHandler.if} */
  if?: string | boolean;

  /** {@inheritDoc ConditionalEventHandler.else} */
  else?: BrickEventHandler | BrickEventHandler[];
}

/**
 * 批量更新子项
 */
export interface BatchUpdateContextItem {
  name: string;
  value: unknown;
}

/**
 * 使用 Provider 进行轮询时的选项配置。
 */
export interface ProviderPollOptions {
  /** 是否启用轮询。 */
  enabled?: boolean;

  /** 每次轮询间隔时间（毫秒），默认为 `3000`。 */
  interval?: number;

  /** 第一次轮询延迟时间（毫秒），默认为 `0`。 */
  leadingRequestDelay?: number;

  /** 当轮询出现错误时，是否继续轮询。 */
  continueOnError?: boolean;

  /** 是否代理系统加载条的显示与隐藏。应配合 `expectPollEnd` 使用。 */
  delegateLoadingBar?: boolean;

  /**
   * 提供一个方法以校验轮询是否应该结束。
   * 该方法接收一个参数：当前轮询的执行结果。
   * 轮询结束时将触发 `callback.success` 事件。
   */
  expectPollEnd?: (result: unknown) => boolean;

  /**
   * 提供一个方法以校验轮询是否应该立即停止，还在等待或进行中的轮询将失效，
   * 不会触发 `progress|success|error|finally` 等事件。
   */
  expectPollStopImmediately?: () => boolean;
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
  targetRef?: string | string[];

  /**
   * 是否使用 `target` 匹配多个构件。
   */
  multiple?: boolean;

  /** {@inheritDoc BuiltinBrickEventHandler.if} */
  if?: string | boolean;

  /** {@inheritDoc ConditionalEventHandler.else} */
  else?: BrickEventHandler | BrickEventHandler[];
}

/*
 * 条件判断处理
 */
export interface ConditionalEventHandler {
  /** {@inheritDoc BuiltinBrickEventHandler.if} */
  if?: string | boolean;
  /** 满足条件分支 */
  then: BrickEventHandler | BrickEventHandler[];
  /** 不满足条件分支 */
  else?: BrickEventHandler | BrickEventHandler[];
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

  /**
   * 轮询接口时，每次轮询得到结果时要执行的动作。为后续动作传递的事件的 `detail` 为该执行结果。
   */
  progress?: BrickEventHandler | BrickEventHandler[];
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
}

/** 使用指定构件进行事件处理的配置。 */
export type CustomBrickEventHandler =
  | ExecuteCustomBrickEventHandler
  | SetPropsCustomBrickEventHandler;

/** 使用 `useBrick` 自行渲染子构件的配置。 */
export type UseBrickConf = UseSingleBrickConf | UseSingleBrickConf[];

/** 使用 `useBrick` 自行渲染子构件的配置（单个）。 */
export type UseSingleBrickConf = Omit<
  BrickConf,
  "lifeCycle" | "slots" | "children"
> & {
  /** {@inheritDoc BrickConfInTemplate.ref} */
  ref?: string;

  /** {@inheritDoc UseBrickLifeCycle} */
  lifeCycle?: UseBrickLifeCycle;

  /** {@inheritDoc UseBrickSlotsConf} */
  slots?: UseBrickSlotsConf;

  /** {@inheritDoc BrickConf.children} */
  children?: UseSingleBrickConf[];
};

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
 * `useBrick` 的构件生命周期配置。
 */
export type UseBrickLifeCycle = Pick<
  BrickLifeCycle,
  "onMount" | "onUnmount" | "onScrollIntoView" | "onMediaChange"
>;

/**
 * 应用的 Storyboard 元信息（包括自定义模板和国际化配置）。
 */
export interface StoryboardMeta {
  /** 应用定义的自定义模板列表。 */
  customTemplates?: CustomTemplate[];

  /** {@inheritDoc MetaI18n} */
  i18n?: MetaI18n;

  /** 应用定义的函数列表。 */
  functions?: StoryboardFunction[];

  // menus?: MenuRawData[];
  menus?: any[];

  // injectMenus?: MenuRawData[];
  injectMenus?: any[];

  /** 应用启用mock服务列表 */
  mocks?: Mocks;

  /** 应用所用到的契约 **/
  contracts?: Contract[];
}

export interface Mocks {
  /** mock id */
  mockId: string;

  /** 使用mock规则列表 */
  mockList: MockRule[];
}

/**
 * 应用启用mock服务
 */
export interface MockRule {
  /** uri地址 */
  uri: string;
  /** provider名称 */
  provider: string;
  /** method方法 */
  method?: string;
}

export interface ExtField {
  name?: string;
  source?: "body" | "query";
}

export interface ContractFieldItem {
  name: string;
  type: string;
  description: string;
  fields?: (ContractFieldItem | ContractFieldRefItem)[];
}

export interface ContractFieldRefItem {
  ref: string;
}

export type ContractField = ContractFieldItem | ContractFieldRefItem;

export interface ContractResponse {
  wrapper?: boolean;
  type?: "file" | "object";
  required?: string[];
  default?: Record<string, unknown>;
  fields?: ContractField[];
  description?: string;
}

export type ContractRequest = Omit<ContractResponse, "wrapper">;

export interface Contract {
  name: string;
  namespaceId: string;
  serviceName?: string;
  version: string;
  endpoint: {
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
    uri: string;
    ext_fields?: ExtField[];
  };
  response?: ContractResponse;
  request?: ContractRequest;
}

/**
 * 应用定义的函数。
 */
export interface StoryboardFunction {
  /** 函数名称。 */
  name: string;
  /** 函数源码。 */
  source: string;
  /** 是否使用 TypeScript。 */
  typescript?: boolean;
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

  /** 状态数据配置列表。 */
  state?: ContextConf[];

  /** 契约的定义，只有 widget 才有该字段 */
  contracts?: Contract[];

  /** 构件编排 ID */
  iid?: string;
}

/**
 * 自定义模板构造声明。
 */
export type CustomTemplateConstructor = Omit<CustomTemplate, "name">;

/** 自定义模板渲染的构件配置。 */
export type BrickConfInTemplate = Omit<BrickConf, "slots" | "children"> & {
  /** 用于在自定义模板内部引用的 ID。 */
  ref?: string;

  /** {@inheritDoc SlotsConfInTemplate} */
  slots?: SlotsConfInTemplate;

  /** {@inheritDoc BrickConf.children} */
  children?: BrickConfInTemplate[];
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
  type?: "bricks";

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
export type CustomTemplateProxyProperty = CustomTemplateProxyRefProperty;

/** 自定义模板引用内部构件属性的属性代理配置 */
export type CustomTemplateProxyRefProperty = CustomTemplateProxyBasicProperty;

/** 自定义模板的基本属性代理配置。 */
export interface CustomTemplateProxyBasicProperty
  extends CustomTemplateProxyWithExtra {
  /** 要代理的构件的属性名。 */
  refProperty?: string;
}

/** 自定义模板的可合并的属性代理配置。 */
export type CustomTemplateProxyMergeableProperty =
  | CustomTemplateProxyMergeablePropertyOfArray
  | CustomTemplateProxyMergeablePropertyOfObject;

/** 自定义模板的可合并的属性代理配置基类型。 */
export interface CustomTemplateProxyMergeablePropertyBase
  extends CustomTemplateProxyWithExtra {
  /** 要合并到的构件的属性名。 */
  mergeProperty: string;
}

/** 自定义模板的可合并的数组属性代理配置。 */
export interface CustomTemplateProxyMergeablePropertyOfArray
  extends CustomTemplateProxyMergeablePropertyBase {
  /** 合并类型。 */
  mergeType: "array";

  /** 合并方法。 */
  mergeMethod: "append" | "prepend" | "insertAt";

  /** 合并参数。 */
  mergeArgs?: unknown[];
}

/** 自定义模板的可合并的对象属性代理配置。 */
export interface CustomTemplateProxyMergeablePropertyOfObject
  extends CustomTemplateProxyMergeablePropertyBase {
  /** {@inheritDoc CustomTemplateProxyMergeablePropertyOfArray.mergeType} */
  mergeType: "object";

  /** {@inheritDoc CustomTemplateProxyMergeablePropertyOfArray.mergeMethod} */
  mergeMethod: "extend";
}

export interface CustomTemplateProxyWithExtra {
  /** 要代理的构件的引用 ID。 */
  ref: string;
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
export interface CustomTemplateProxyEvent extends CustomTemplateProxyWithExtra {
  /** 要代理的事件类型名。 */
  refEvent?: string;
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
export interface CustomTemplateProxySlot extends CustomTemplateProxyWithExtra {
  /** 要代理的插槽名。 */
  refSlot?: string;

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
export interface CustomTemplateProxyMethod
  extends CustomTemplateProxyWithExtra {
  /** 要代理的方法名。 */
  refMethod?: string;
}

/**
 * 站点主题。
 */
export type SiteTheme = "light" | "dark" | "dark-v2";

/**
 * 站点模式。
 */
export type SiteMode = "default" | "dashboard";

/**
 * 国际化数据，以语言为键、文本内容为值的键值对。
 */
export interface I18nData {
  [language: string]: string;
}

export interface SnippetParamField {
  type: string;
  defaultValue?: unknown;
}

export type SnippetDeclareParams = Record<string, SnippetParamField>;

export interface RuntimeSnippet {
  snippetId: string;
  brick?: string;
  bricks: BrickConf[];
  data?: ContextConf[];
  params?: SnippetDeclareParams;
}
