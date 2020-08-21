import { Key } from "path-to-regexp";
import { History, Location, LocationDescriptor } from "history";
import {
  BreadcrumbItemConf,
  MicroApp,
  BrickConf,
  FeatureFlags,
  SeguesConf,
  BrickEventHandler,
} from "./manifest";
import { SidebarMenu, SidebarSubMenu } from "./menu";

export interface CompileOptions {
  end?: boolean;
  strict?: boolean;
  sensitive?: boolean;
}

export interface CompileResult {
  regexp: RegExp;
  keys: Key[];
}

export interface MatchOptions {
  path: string | string[];
  exact?: boolean;
}

export interface MatchResult {
  path: string;
  url: string;
  isExact: boolean;
  params: MatchParams;
}

export interface MatchParams {
  [key: string]: string;
}

export interface SystemInfo {
  org: number;
  username: string;
  userInstanceId: string;
  loginFrom?: string;
}

export type PluginLocation = Location<PluginHistoryState>;
export type PluginHistory = History<PluginHistoryState> & ExtendedHistory;

export interface ExtendedHistory {
  pushQuery: UpdateQueryFunction;
  replaceQuery: UpdateQueryFunction;
  pushAnchor: UpdateAnchorFunction;
  // replaceAnchor: UpdateAnchorFunction;
  reload: () => void;
}

export type UpdateQueryFunction = (
  query: Record<string, any>,
  options?: UpdateQueryOptions
) => void;

export interface UpdateQueryOptions extends PluginHistoryState {
  extraQuery?: Record<string, any>;
  clear?: boolean;
}

export type UpdateAnchorFunction = (
  hash: string,
  state?: PluginHistoryState
) => void;

export interface PluginHistoryState {
  notify?: boolean;
  from?: LocationDescriptor<PluginHistoryState>;
}

export interface PluginRuntimeContext {
  query: URLSearchParams;
  match?: MatchResult;
  event?: CustomEvent;
  app?: MicroApp;
  hash?: string;
  anchor?: string;
  sys?: SystemInfo;
  flags?: FeatureFlags;
  segues?: SeguesConf;
  storyboardContext?: StoryboardContext;
}

export type StoryboardContext = Map<string, StoryboardContextItem>;

export type StoryboardContextItem =
  | StoryboardContextItemFreeVariable
  | StoryboardContextItemBrickProperty;

export interface StoryboardContextItemFreeVariable {
  type: "free-variable";
  value: any;
}

export interface StoryboardContextItemBrickProperty {
  type: "brick-property";
  brick: {
    element?: HTMLElement;
  };
  prop: string;
}

export interface MountPoints {
  menuBar: HTMLElement;
  appBar: HTMLElement;
  loadingBar: HTMLElement;
  main: HTMLElement;
  bg: HTMLElement;
  portal: HTMLElement;
}

export interface MenuBarBrick extends HTMLElement {
  menu: SidebarMenu;
  subMenu: SidebarSubMenu;
  collapsed: boolean;
  softExpanded: boolean;
}

export interface AppBarBrick extends HTMLElement {
  pageTitle: string;
  appendBreadcrumb: (breadcrumb: BreadcrumbItemConf[]) => void;
  setBreadcrumb: (breadcrumb: BreadcrumbItemConf[]) => void;
  breadcrumb: BreadcrumbItemConf[];
}

export interface InterceptorParams {
  ignoreLoadingBar?: boolean;
}

export type BrickTemplateFactory = (params?: any) => BrickConf;

export type TemplateRegistry<T> = Map<string, T>;

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

export interface MagicBrickConfig {
  selector: string;
  brick: string;
  events?: string;
  properties?: string;
  resolves?: string;
  scene: "create" | "read" | "update" | "delete";
  transform?: string;
}

export type rememberedEventListener = [
  string,
  EventListener,
  // For compatibility of legacy api in @easyops/brick-utils,
  // the third element is optional.
  BrickEventHandler?
];

export interface RuntimeBrickElement extends HTMLElement {
  $$typeof?: "brick" | "provider" | "custom-template" | "native" | "invalid";
  $$eventListeners?: rememberedEventListener[];
  $$getElementByRef?: (ref: string) => HTMLElement;
}
