import { Key } from "path-to-regexp";
import { History, Location, LocationDescriptor } from "history";
import {
  BreadcrumbItemConf,
  MicroApp,
  BrickConf,
  FeatureFlags
} from "./manifest";
import { SidebarMenu } from "./menu";

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
  username: string;
  userInstanceId: string;
}

export type PluginHistory = History<PluginHistoryState>;
export type PluginLocation = Location<PluginHistoryState>;

export interface PluginHistoryState {
  notify?: boolean;
  from?: LocationDescriptor;
}

export interface PluginRuntimeContext {
  query: URLSearchParams;
  match?: MatchResult;
  event?: CustomEvent;
  app?: MicroApp;
  hash?: string;
  sys?: SystemInfo;
  flags?: FeatureFlags;
}

export interface MountPoints {
  menuBar: HTMLElement;
  appBar: HTMLElement;
  loadingBar: HTMLElement;
  main: HTMLElement;
  bg: HTMLElement;
}

export interface MenuBarBrick extends HTMLElement {
  menu: SidebarMenu;
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

export type rememberedEventListener = [string, EventListener];

export interface RuntimeBrickElement extends HTMLElement {
  $$eventListeners?: rememberedEventListener[];
}
