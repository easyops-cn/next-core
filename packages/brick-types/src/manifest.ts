import { LocationDescriptor } from "history";
import { SidebarMenu, MenuIcon } from "./menu";
import { PluginHistoryState } from "./runtime";

export interface BootstrapData {
  brickPackages: BrickPackage[];
  templatePackages: TemplatePackage[];
  navbar: NavbarConf;
  storyboards: Storyboard[];
  settings: Settings;
  desktops: DesktopData[];
}

export interface RuntimeBootstrapData extends BootstrapData {
  storyboards: RuntimeStoryboard[];
  microApps: MicroApp[];
}

export interface Settings {
  featureFlags: FeatureFlags;
  homepage: string;
  [key: string]: any;
}

export type FeatureFlags = Record<string, boolean>;

export interface MicroApp {
  name: string;
  id: string;
  homepage: string;
  icons?: {
    large: string;
  };
  iconBackground?: "circle" | "square";
  internal?: boolean;
  private?: boolean;
  installStatus?: "ok" | "running";
  status?: "developing" | "enabled" | "disabled";
  legacy?: "iframe";
  menuIcon?: MenuIcon;
}

export interface BrickPackage {
  bricks: string[];
  filePath: string;
  dll?: string[];
}

export interface TemplatePackage {
  templates: string[];
  filePath: string;
}

export interface AuthInfo {
  username?: string;
}

export interface NavbarConf {
  menuBar: string;
  appBar: string;
  loadingBar: string;
}

export interface Storyboard {
  imports?: string[];
  routes: RouteConf[];
  app?: MicroApp;
  dependsAll?: boolean;
}

export interface RuntimeStoryboard extends Storyboard {
  depsProcessed?: boolean;
}

export interface RouteConf<B = any, M = any> {
  path: string | string[];
  exact?: boolean;
  public?: boolean;
  bricks: BrickConf<B>[];
  menu?: MenuConf<M>;
}

export interface BrickConf<T = any> {
  brick?: string;
  slots?: SlotsConf;
  injectDeep?: boolean;
  properties?: T;
  events?: BrickEventsMap;
  bg?: boolean;
  lifeCycle?: BrickLifeCycle;
  internalUsedBricks?: string[];
  internalUsedTemplates?: string[];
  template?: string;
  params?: Record<string, any>;

  // Runtime properties.
  $template?: string;
  $params?: Record<string, any>;
}

export interface BrickLifeCycle {
  // Before mounting brick, wait some async tasks to resolve.
  useResolves?: ResolveConf[];

  // Give a method name to execute when brick did mount.
  didMount?: string;
}

export interface ResolveConf {
  name: string;
  provider: string;
  method?: string;
  args?: any[];
  field?: string | string[];
}

export type MenuConf<T = any> = false | StaticMenuConf | BrickMenuConf<T>;

export interface StaticMenuConf extends StaticMenuProps {
  type?: "static";
}

export interface StaticMenuProps {
  pageTitle?: string;
  sidebarMenu?: SidebarMenu;
  breadcrumb?: BreadcrumbConf;
  injectDeep?: boolean;
}

export interface BreadcrumbConf {
  items: BreadcrumbItemConf[];
  overwrite?: boolean;
}

export interface BreadcrumbItemConf {
  text: string;
  to?: LocationDescriptor<PluginHistoryState>;
}

export interface BrickMenuConf<T = any> {
  type: "brick";
  brick: string;
  injectDeep?: boolean;
  properties?: T;
  events?: BrickEventsMap;
  template?: string;
  params?: any[];
  $template?: string;
  $params?: any[];
}

export interface SlotsConf {
  [slotId: string]: SlotConf;
}

export type SlotConf = SlotConfOfBricks | SlotConfOfRoutes;

export interface SlotConfOfBricks {
  type: "bricks";
  bricks: BrickConf[];
}

export interface SlotConfOfRoutes {
  type: "routes";
  routes: RouteConf[];
  switch?: boolean;
}

export type SlotType = "bricks" | "routes";

export interface BrickEventsMap {
  [key: string]: BrickEventHandler | BrickEventHandler[];
}

export type BrickEventHandler =
  | BuiltinBrickEventHandler
  | CustomBrickEventHandler;

export interface BuiltinBrickEventHandler {
  action:
    | "history.push"
    | "history.replace"
    | "console.log"
    | "console.error"
    | "console.warn"
    | "console.info";
  args?: any[]; // Defaults to the event itself
}

export interface CustomBrickEventHandler {
  target: string; // The target element selector
  method: string; // The element's method
  multiple?: boolean; // Use `querySelectorAll` or `querySelector`
  args?: any[]; // Defaults to the event itself
}

export interface DesktopData {
  items: DesktopItem[];
}

export type DesktopItem = DesktopItemApp | DesktopItemDir;

export interface DesktopItemApp {
  type: "app";
  id: string;
  app?: MicroApp;
}

export interface DesktopItemDir {
  type: "dir";
  id: string;
  name: string;
  items: DesktopItemApp[];
}
