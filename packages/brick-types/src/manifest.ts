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
  $$routeAliasMap?: RouteAliasMap;
}

export type RouteAliasMap = Map<string, RouteAliasConf>;

export type RouteAliasConf = Pick<RouteConf, "path" | "alias">;

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
  org?: number;
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
  routes?: RouteConf[];
  app?: MicroApp;
  dependsAll?: boolean;
  meta?: StoryboardMeta;
}

export interface RuntimeStoryboard extends Storyboard {
  $$depsProcessed?: boolean;
  $$registerCustomTemplateProcessed?: boolean;
  $$fulfilled?: boolean;
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
  path: string;
  alias?: string;
  exact?: boolean;
  public?: boolean;
  menu?: MenuConf;
  hybrid?: boolean;
  providers?: ProviderConf[];
  defineResolves?: DefineResolveConf[];
  redirect?: string | ResolveConf;
  segues?: SeguesConf;
}

export interface SeguesConf {
  [segueId: string]: SegueConf;
}

export interface SegueConf {
  target: string;
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
  if?: string | boolean | ResolveConf;
  portal?: boolean;
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
  $$if?: string | boolean | ResolveConf;
  $$computedPropsFromProxy?: Record<string, any>;
  $$refForProxy?: RefForProxy;
  $$parentTemplate?: ProbablyRuntimeBrick;
}

export interface BrickLifeCycle {
  // Before mounting bricks, wait some async tasks to be resolved.
  useResolves?: ResolveConf[];
  onPageLoad?: BrickEventHandler | BrickEventHandler[];
  onAnchorLoad?: BrickEventHandler | BrickEventHandler[];
  onAnchorUnload?: BrickEventHandler | BrickEventHandler[];
}

export type ResolveConf = EntityResolveConf | RefResolveConf;

export interface EntityResolveConf {
  provider: string;
  method?: string;
  args?: any[];
  field?: string | string[];
  name?: string;
  transformFrom?: string | string[];
  transformMapArray?: boolean | "auto";
  transform?: GeneralTransform;
  onReject?: HandleReject;
}

export interface DefineResolveConf
  extends Omit<EntityResolveConf, "name" | "onReject"> {
  id: string;
}

export interface RefResolveConf {
  ref: string;
  name?: string;
  transformFrom?: string | string[];
  transformMapArray?: boolean | "auto";
  transform?: GeneralTransform;
  onReject?: HandleReject;
}

export type HandleReject = HandleRejectByTransform /*| HandleRejectByCatch*/;

export interface HandleRejectByTransform {
  transform: GeneralTransform;
}

export interface HandleRejectByCatch {
  catch: true;
}

export type GeneralTransform = string | TransformMap | TransformItem[];

export interface TransformMap {
  [propName: string]: any;
}

export interface TransformItem {
  from?: string | string[];
  to: string | TransformMap;
  mapArray?: boolean | "auto";
}

export type MenuConf = false | StaticMenuConf | BrickMenuConf | ResolveMenuConf;

export interface StaticMenuConf extends StaticMenuProps {
  type?: "static";
}

export interface StaticMenuProps {
  pageTitle?: string;
  sidebarMenu?: SidebarMenu;
  menuId?: string;
  subMenuId?: string;
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

export interface ResolveMenuConf {
  type: "resolve";
  resolve: ResolveConf;
}

export interface SlotsConf {
  [slotName: string]: SlotConf;
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

export interface SlotsConfOfBricks {
  [slotName: string]: SlotConfOfBricks;
}

export type SlotType = "bricks" | "routes";

export interface BrickEventsMap {
  [key: string]: BrickEventHandler | BrickEventHandler[];
}

export type BrickEventHandler =
  | BuiltinBrickEventHandler
  | CustomBrickEventHandler;

export interface BuiltinBrickEventHandler {
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

    // Browser method
    | "location.reload"
    | "location.assign"
    | "window.open"
    | "segue.push"
    | "segue.replace"
    | "event.preventDefault"
    | "console.log"
    | "console.error"
    | "console.warn"
    | "console.info"

    // anted message
    | "message.success"
    | "message.error"
    | "message.info"
    | "message.warn"

    // handleHttpError
    | "handleHttpError"

    // iframe
    | "legacy.go";
  args?: any[]; // Defaults to the event itself
  if?: string | boolean;
}

export interface BaseCustomBrickEventHandler {
  target?: string | any; // The target element selector or element itself.
  targetRef?: string; // The target ref inside a custom template.
  multiple?: boolean; // Use `querySelectorAll` or `querySelector`
  if?: string | boolean;
}

export interface ExecuteCustomBrickEventHandler
  extends BaseCustomBrickEventHandler {
  method: string; // The element's method
  args?: any[]; // Defaults to the event itself
  callback?: {
    success?: BrickEventHandler | BrickEventHandler[];
    error?: BrickEventHandler | BrickEventHandler[];
    finally?: BrickEventHandler | BrickEventHandler[];
  };
}

export interface SetPropsCustomBrickEventHandler
  extends BaseCustomBrickEventHandler {
  properties: Record<string, any>; // Properties to set
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
  brick: string;
  properties?: Record<string, any>;
  events?: BrickEventsMap;
  lifeCycle?: Pick<BrickLifeCycle, "useResolves">;
  transformFrom?: string | string[];
  transform?: GeneralTransform;
  if?: string | boolean | ResolveConf;
  slots?: UseBrickSlotsConf;
}

export interface UseBrickSlotsConf {
  [slotName: string]: UseBrickSlotConf;
}

export interface UseBrickSlotConf {
  type?: "bricks";
  bricks: UseSingleBrickConf[];
}

export interface StoryboardMeta {
  customTemplates?: CustomTemplate[];
  i18n?: MetaI18n;
}

export type MetaI18n = Record<string, Record<string, string>>;

/* Custom Templates Starts */
export interface CustomTemplate {
  name: string;
  bricks: BrickConfInTemplate[];
  proxy?: CustomTemplateProxy;
}

export type CustomTemplateConstructor = Omit<CustomTemplate, "name">;

export type BrickConfInTemplate = Omit<
  BrickConf,
  "brick" | "slots" | "template" | "params"
> & {
  brick: string;
  ref?: string;
  slots?: SlotsConfInTemplate;
};

export interface SlotsConfInTemplate {
  [slotName: string]: SlotConfInTemplate;
}

export interface SlotConfInTemplate {
  type: "bricks";
  bricks: BrickConfInTemplate[];
}

export interface CustomTemplateProxy {
  properties?: CustomTemplateProxyProperties;
  events?: CustomTemplateProxyEvents;
  slots?: CustomTemplateProxySlots;
  methods?: CustomTemplateProxyMethods;
}

export interface CustomTemplateProxyProperties {
  [name: string]: CustomTemplateProxyProperty;
}

export type CustomTemplateProxyProperty =
  | CustomTemplateProxyBasicProperty
  | CustomTemplateProxyTransformableProperty;

export interface CustomTemplateProxyBasicProperty {
  ref: string;
  refProperty: string;
}

export interface CustomTemplateProxyTransformableProperty {
  ref: string;
  refTransform: GeneralTransform;
}

export interface CustomTemplateProxyEvents {
  [name: string]: CustomTemplateProxyEvent;
}

export interface CustomTemplateProxyEvent {
  ref: string;
  refEvent: string;
}

export interface CustomTemplateProxySlots {
  [name: string]: CustomTemplateProxySlot;
}

export interface CustomTemplateProxySlot {
  ref: string;
  refSlot: string;
  refPosition?: number;
}

export interface CustomTemplateProxyMethods {
  [name: string]: CustomTemplateProxyMethod;
}

export interface CustomTemplateProxyMethod {
  ref: string;
  refMethod: string;
}

export interface RefForProxy {
  brick?: ProbablyRuntimeBrick;
}

export interface ProbablyRuntimeBrick {
  element?: HTMLElement;
}

/* Custom Templates Ends */
