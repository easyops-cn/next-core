import { Key } from "path-to-regexp";
import { History, Location, LocationDescriptor } from "history";
import {
  BreadcrumbItemConf,
  MicroApp,
  BrickConf,
  FeatureFlags,
  SeguesConf,
  BrickEventHandler,
  BrickEventHandlerCallback,
  ContextConf,
  BrickPackage,
} from "./manifest";
import { SidebarMenu, SidebarSubMenu } from "./menu";

export interface RuntimeContext {
  app: MicroApp;
  overrideApp?: MicroApp;
  location: Location;
  query: URLSearchParams;
  /** {@inheritDoc FeatureFlags} */
  flags: FeatureFlags;
  /** 系统运行时信息，包括登录信息和页面信息。 */
  sys: Record<string, unknown>;
  brickPackages: BrickPackage[];
  ctxStore: AbstractDataStore;
  pendingPermissionsPreCheck: (Promise<unknown> | undefined)[];
  match?: MatchResult;
  event?: Event;
  data?: unknown;
}

export type AsyncProperties = Promise<Record<string, unknown>>;

export interface AbstractDataStore {
  getValue(name: string): unknown;

  updateValue(
    name: string,
    value: unknown,
    method: "assign" | "replace" | "refresh" | "load",
    runtimeContext: RuntimeContext,
    callback?: BrickEventHandlerCallback
  ): void;

  define(
    dataConfs: ContextConf[] | undefined,
    runtimeContext: RuntimeContext,
    asyncHostProperties?: AsyncProperties
  ): void;

  waitFor(dataNames: Iterable<string>): Promise<void>;

  waitForAll(): Promise<void>;

  onChange(dataName: string, listener: EventListener): void;
}

/** @internal */
export interface CompileOptions {
  end?: boolean;
  strict?: boolean;
  sensitive?: boolean;
}

/** @internal */
export interface CompileResult {
  regexp: RegExp;
  keys: Key[];
}

/** @internal */
export interface MatchOptions {
  path: string | string[];
  exact?: boolean;
}

/** @internal */
export interface MatchResult {
  path: string;
  url: string;
  isExact: boolean;
  params: MatchParams;
}

/** @internal */
export interface MatchParams {
  [key: string]: string;
}

/**
 * @internal
 */
export type PluginLocation = Location<PluginHistoryState>;

/**
 * 系统会话对象。
 */
export type PluginHistory = History<PluginHistoryState> & ExtendedHistory;

/**
 * 扩展的系统会话对象。
 */
export interface ExtendedHistory {
  /**
   * 更新指定的 query 参数，会保留当前其它 query 参数，往浏览器会话历史栈中推入一条新记录。
   */
  pushQuery: UpdateQueryFunction;

  /**
   * 更新指定的 query 参数，会保留当前其它 query 参数，替换浏览器会话历史栈中最新的一条记录。
   */
  replaceQuery: UpdateQueryFunction;

  /** {@inheritDoc UpdateAnchorFunction} */
  pushAnchor: UpdateAnchorFunction;

  /** 重载当前会话，即触发页面重新渲染。与 location.reload() 不同，它不会触发浏览器页面的重载。 */
  reload: (callback?: (blocked: boolean) => void) => void;

  /** @internal */
  setBlockMessage: (message: string | undefined) => void;

  /** @internal */
  getBlockMessage: () => string | undefined;

  /** 取消之前设置的阻止页面离开信息的设置。 */
  unblock: () => void;

  /** 推入一条记录。*/
  push?: (
    location: LocationDescriptor<PluginHistoryState>,
    state?: PluginHistoryState,
    callback?: (blocked: boolean) => void
  ) => void;

  /** 替换一条记录。*/
  replace?: (
    location: LocationDescriptor<PluginHistoryState>,
    state?: PluginHistoryState,
    callback?: (blocked: boolean) => void
  ) => void;
}

/**
 * 更新指定的 query 参数。
 *
 * @param query - 要更新的 query 参数。
 * @param options - 选项。
 */
export type UpdateQueryFunction = (
  query: Record<string, unknown>,
  options?: UpdateQueryOptions,
  callback?: (blocked: boolean) => void
) => void;

/** 更新 query 参数时的选项 */
export interface UpdateQueryOptions extends PluginHistoryState {
  /** 额外要更新的 query 参数。 */
  extraQuery?: Record<string, unknown>;
  /** 是否同时清除当前的所有其它 query 参数。 */
  clear?: boolean;
  /** 是否保留当前 hash 参数。 */
  keepHash?: boolean;
}

/**
 * 设置指定的 anchor （URL hash）地址，此方法默认不会触发页面重新渲染。
 * 往浏览器会话历史栈中推入一条新记录。
 *
 * @param hash - Hash 地址。
 * @param state - 会话状态设置。
 */
export type UpdateAnchorFunction = (
  hash: string,
  state?: PluginHistoryState,
  callback?: (blocked: boolean) => void
) => void;

/** @internal */
export interface PluginHistoryState {
  notify?: boolean;
  from?: LocationDescriptor<PluginHistoryState>;
}

/**
 * 系统运行时信息。
 */
export interface PluginRuntimeContext {
  /** 当前的 query 参数。 */
  query?: URLSearchParams;

  /**
   * @internal
   */
  match?: MatchResult;

  /**
   * 当前的在事件处理中的事件对象。
   */
  event?: CustomEvent;

  /**
   * 当前的应用信息。
   */
  app?: MicroApp;

  /**
   * 用于跨应用菜单注入等场景的应用重载。
   */
  overrideApp?: MicroApp;

  /** 扩展当前表达式的国际化命名空间。 */
  appendI18nNamespace?: string;

  /** 当前的 hash 参数 */
  hash?: string;

  /** 当前的 pathname 参数 */
  pathname?: string;

  /** {@inheritDoc SystemInfo} */
  // sys?: SystemInfo;

  /** {@inheritDoc FeatureFlags} */
  flags?: FeatureFlags;

  /** 当前应用的页面切换配置。 */
  segues?: SeguesConf;

  /** @internal */
  storyboardContext?: StoryboardContext;

  /** @internal */
  tplContextId?: string;

  /** @internal */
  formContextId?: string;
}

/** @internal */
export type StoryboardContext = Map<string, StoryboardContextItem>;

/** @internal */
export type StoryboardContextItem =
  | StoryboardContextItemFreeVariable
  | StoryboardContextItemBrickProperty;

/** @internal */
export interface StoryboardContextItemFreeVariable {
  type: "free-variable";
  value: unknown;
  eventTarget?: EventTarget;
  loaded?: boolean;
  loading?: Promise<unknown>;
  load?: (options?: ResolveOptions) => Promise<unknown>;
}

/** @internal */
export interface ResolveOptions {
  /**
   * Cache mode of resolve.
   *
   * See https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
   *
   * - `default`: Looks for a matching cache.
   * - `reload`: Without looking for a matching cache.
   */
  cache?: "default" | "reload";
}

/** @internal */
export interface StoryboardContextItemBrickProperty {
  type: "brick-property";
  brick: {
    element?: HTMLElement;
  };
  prop: string;
}

/** @internal */
export interface MountPoints {
  menuBar: HTMLElement;
  appBar: HTMLElement;
  loadingBar: HTMLElement;
  main: HTMLElement;
  bg: HTMLElement;
  portal: HTMLElement;
}

/** @internal */
export interface MenuBarBrick extends HTMLElement {
  menu: SidebarMenu;
  subMenu: SidebarSubMenu;
  collapsed: boolean;
  softExpanded: boolean;
}

/** @internal */
export interface AppBarBrick extends HTMLElement {
  pageTitle: string;
  appendBreadcrumb: (breadcrumb: BreadcrumbItemConf[]) => void;
  setBreadcrumb: (breadcrumb: BreadcrumbItemConf[]) => void;
  breadcrumb: BreadcrumbItemConf[];
}

/**
 * 用于 http 请求的拦截器参数。
 */
export interface InterceptorParams {
  /**
   * 是否忽略该请求对系统加载进度条的通知。
   */
  ignoreLoadingBar?: boolean;
}

/** @internal */
export type BrickTemplateFactory = (params?: unknown) => BrickConf;

/** @internal */
export type TemplateRegistry<T> = Map<string, T>;

/** @internal */
export interface UserInfo {
  instanceId: string;
  name: string;
  nickname: string;
  user_email: string;
  user_tel: string;
  state: "valid" | "invalid";
  user_icon: string;
  user_memo: string;
}

export interface NavTip {
  tipKey: string;
  text: string;
  closable?: boolean;
  info?: {
    url: string;
    label: string;
  };
  isCenter?: boolean;
  backgroundColor?: string;
}

/** @internal */
export interface MagicBrickConfig {
  selector: string;
  brick: string;
  events?: string;
  properties?: string;
  resolves?: string;
  scene: "create" | "read" | "update" | "delete";
  transform?: string;
}

/** @internal */
export type MetaInfoOfEventListener = [
  string,
  // For compatibility of devtools, leave the second argument there.
  null | undefined,
  BrickEventHandler
];

export type RememberedEventListener = [string, EventListener];

/** @internal */
export interface RuntimeBrickElement extends HTMLElement {
  $$typeof?: "brick" | "provider" | "custom-template" | "native" | "invalid";
  /** Meta info of listeners, for devtools only */
  $$eventListeners?: MetaInfoOfEventListener[];
  /** Remembered listeners for unbinding */
  $$listeners?: RememberedEventListener[];
  /** Find element by ref in a custom template */
  $$getElementByRef?: (ref: string) => HTMLElement;
}
