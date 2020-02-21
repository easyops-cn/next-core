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
  originalStoryboards: Storyboard[];
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
  defaultConfig?: Record<string, any>;
  userConfig?: Record<string, any>;
  config?: Record<string, any>;
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
  userInstanceId?: string;
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
  $$depsProcessed?: boolean;
}

export type RouteConf =
  | RouteConfOfBricks
  | RouteConfOfRoutes
  | RouteConfOfRedirect;

export interface RouteConfOfBricks extends BaseRouteConf {
  type?: "bricks";
  bricks: BrickConf[];
}

export interface RouteConfOfRoutes extends BaseRouteConf {
  type: "routes";
  routes: RouteConf[];
}

export interface RouteConfOfRedirect extends BaseRouteConf {
  type?: "redirect";
  redirect: string | ResolveConf;
}

export interface BaseRouteConf {
  path: string | string[];
  exact?: boolean;
  public?: boolean;
  menu?: MenuConf;
  hybrid?: boolean;
  providers?: ProviderConf[];
  defineResolves?: DefineResolveConf[];
  redirect?: string | ResolveConf;
}

export interface BrickConf {
  brick?: string;
  slots?: SlotsConf;
  injectDeep?: boolean;
  properties?: Record<string, any>;
  events?: BrickEventsMap;
  bg?: boolean;
  lifeCycle?: BrickLifeCycle;
  internalUsedBricks?: string[];
  internalUsedTemplates?: string[];
  template?: string;
  params?: Record<string, any>;
  if?: string | ResolveConf;
}

export type ProviderConf =
  | string
  | Pick<BrickConf, "brick" | "properties" | "events" | "lifeCycle">;

export interface RuntimeBrickConf extends BrickConf {
  $$dynamic?: boolean;
  $$resolved?: boolean;
  $$template?: string;
  $$params?: Record<string, any>;
  $$lifeCycle?: BrickLifeCycle;
  $$if?: string | ResolveConf;
}

export interface BrickLifeCycle {
  // Before mounting bricks, wait some async tasks to be resolved.
  useResolves?: ResolveConf[];
  onPageLoad?: BrickEventHandler | BrickEventHandler[];
}

export type ResolveConf = EntityResolveConf | RefResolveConf;

export interface EntityResolveConf {
  provider: string;
  method?: string;
  args?: any[];
  field?: string | string[];
  name?: string;
  transformFrom?: string | string[];
  transform?: GeneralTransform;
}

export interface DefineResolveConf extends Omit<EntityResolveConf, "name"> {
  id: string;
}

export interface RefResolveConf {
  ref: string;
  name?: string;
  transformFrom?: string | string[];
  transform?: GeneralTransform;
}

export type GeneralTransform = string | TransformMap;

export interface TransformMap {
  [propName: string]: any;
}

export type MenuConf = false | StaticMenuConf | BrickMenuConf;

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

export interface BrickMenuConf {
  type: "brick";
  brick: string;
  injectDeep?: boolean;
  properties?: Record<string, any>;
  events?: BrickEventsMap;
  lifeCycle?: BrickLifeCycle;
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
    | "history.pushQuery"
    | "history.replaceQuery"
    | "history.goBack"
    | "history.goForward"
    | "history.reload"
    | "location.reload"
    | "location.assign"
    | "window.open"
    | "event.preventDefault"
    | "console.log"
    | "console.error"
    | "console.warn"
    | "console.info";
  args?: any[]; // Defaults to the event itself
}

export interface BaseCustomBrickEventHandler {
  target: string | any; // The target element selector or element itself.
  multiple?: boolean; // Use `querySelectorAll` or `querySelector`
}

export interface ExecuteCustomBrickEventHandler
  extends BaseCustomBrickEventHandler {
  method: string; // The element's method
  args?: any[]; // Defaults to the event itself
}

export interface SetPropsCustomBrickEventHandler<T = any>
  extends BaseCustomBrickEventHandler {
  properties: T; // Properties to set
  injectDeep?: boolean;
}

export type CustomBrickEventHandler =
  | ExecuteCustomBrickEventHandler
  | SetPropsCustomBrickEventHandler;

export interface DesktopData {
  items: DesktopItem[];
  name?: string;
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

export type UseBrickConf = UseSingleBrickConf | UseSingleBrickConf[];

export interface UseSingleBrickConf {
  brick?: string;
  properties?: Record<string, any>;
  events?: BrickEventsMap;
  lifeCycle?: Pick<BrickLifeCycle, "useResolves">;
  transformFrom?: string | string[];
  transform?: GeneralTransform;
  template?: string;
  params?: any[];
}
