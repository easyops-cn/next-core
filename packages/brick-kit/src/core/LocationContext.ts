import { omit, orderBy, set } from "lodash";
import {
  PluginLocation,
  MatchResult,
  RouteConf,
  RuntimeStoryboard,
  BrickConf,
  PluginHistoryState,
  SidebarMenu,
  SidebarSubMenu,
  MenuConf,
  BreadcrumbItemConf,
  MicroApp,
  ProviderConf,
  PluginRuntimeContext,
  BrickEventHandler,
  ResolveConf,
  StaticMenuProps,
  SeguesConf,
  MessageConf,
  BrickLifeCycle,
  Storyboard,
  StaticMenuConf,
  isRouteConfOfBricks,
  isRouteConfOfRoutes,
} from "@next-core/brick-types";
import {
  isObject,
  matchPath,
  computeRealRoutePath,
  hasOwnProperty,
  scanAppGetMenuInAny,
} from "@next-core/brick-utils";
import { Action, Location } from "history";
import { listenerFactory } from "../internal/bindListeners";
import {
  computeRealProperties,
  computeRealValue,
} from "../internal/setProperties";
import { isLoggedIn, getAuth } from "../auth";
import { getHistory } from "../history";
import {
  RuntimeBrick,
  Kernel,
  appendBrick,
  Resolver,
  asyncExpandCustomTemplate,
  MountableElement,
  getTagNameOfCustomTemplate,
  symbolForComputedPropsFromProxy,
  symbolForRefForProxy,
  symbolForTplContextId,
  ResolveRequestError,
  RuntimeBrickConfWithTplSymbols,
} from "./exports";
import { RedirectConf } from "./interfaces";
import { looseCheckIf, IfContainer } from "../checkIf";
import { getMessageDispatcher, MessageDispatcher } from "./MessageDispatcher";
import { getRuntimeMisc } from "../internal/misc";
import { httpErrorToString } from "../handleHttpError";
import {
  getSubStoryboardByRoute,
  SubStoryboardMatcher,
} from "../internal/getSubStoryboardByRoute";
import { validatePermissions } from "../internal/checkPermissions";
import {
  listenOnTrackingContext,
  TrackingContextItem,
} from "../internal/listenOnTrackingContext";
import { StoryboardContextWrapper } from "./StoryboardContext";
import { preConstructMenus } from "../internal/menu";
import { Media } from "../internal/mediaQuery";
import { getReadOnlyProxy } from "../internal/proxyFactories";
import { customTemplateRegistry } from "./CustomTemplates/constants";
import {
  ExpandCustomForm,
  formDataProperties,
} from "./CustomForms/ExpandCustomForm";
import {
  formRenderer,
  RuntimeBrickConfOfFormSymbols,
  symbolForFormContextId,
} from "./CustomForms/constants";
import { matchStoryboard } from "./matchStoryboard";

export type MatchRoutesResult =
  | {
      match: MatchResult;
      route: RouteConf;
    }
  | "missed"
  | "unauthenticated";

export interface NavConfig {
  breadcrumb: BreadcrumbItemConf[];
  menu: Partial<SidebarMenu>;
  subMenu: Partial<SidebarMenu>;
}

export interface MountRoutesResult {
  main: RuntimeBrick[];
  menuInBg: RuntimeBrick[];
  menuBar: {
    menu?: Partial<SidebarMenu>;
    subMenu?: Partial<SidebarSubMenu>;
    menuId?: string;
    subMenuId?: string;
  };
  portal: RuntimeBrick[];
  appBar: {
    pageTitle?: string;
    breadcrumb: BreadcrumbItemConf[];
    documentId?: string;
    noCurrentApp?: boolean;
  };
  flags: {
    unauthenticated?: boolean;
    redirect?: {
      path: string;
      state?: PluginHistoryState;
    };
    barsHidden?: boolean;
    hybrid?: boolean;
    failed?: boolean;
  };
  route?: RouteConf;
  analyticsData?: Record<string, unknown>;
}

interface BrickAndLifeCycleHandler {
  brick: RuntimeBrick;
  match: MatchResult;
  tplContextId?: string;
  handler: BrickEventHandler | BrickEventHandler[];
}

export interface BrickAndMessage {
  brick: RuntimeBrick;
  match: MatchResult;
  tplContextId?: string;
  message: MessageConf | MessageConf[];
}
interface BrickIntersectionObserver {
  $$observe(): void;
}

export class LocationContext {
  private readonly query: URLSearchParams;
  readonly resolver: Resolver;
  readonly messageDispatcher: MessageDispatcher;
  private readonly beforePageLoadHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly pageLoadHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly beforePageLeaveHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly pageLeaveHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly anchorLoadHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly anchorUnloadHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly mediaChangeHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly messageCloseHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly messageHandlers: BrickAndMessage[] = [];
  private readonly scrollIntoViewHandlersMap: Map<
    string,
    BrickAndLifeCycleHandler
  > = new Map();
  private readonly segues: SeguesConf = {};
  private currentMatch: MatchResult;
  readonly storyboardContextWrapper = new StoryboardContextWrapper();
  private observersList: BrickIntersectionObserver[] = [];

  constructor(private kernel: Kernel, private location: PluginLocation) {
    this.resolver = new Resolver(kernel);
    this.query = new URLSearchParams(location.search);
    this.messageDispatcher = getMessageDispatcher();
  }

  private getContext({
    match,
    tplContextId,
    formContextId,
  }: {
    match: MatchResult;
    tplContextId?: string;
    formContextId?: string;
  }): PluginRuntimeContext {
    const auth = getAuth();
    const context: PluginRuntimeContext = {
      hash: this.location.hash,
      pathname: this.location.pathname,
      query: this.query,
      match,
      app: this.kernel.nextApp,
      sys: {
        org: auth.org,
        username: auth.username,
        userInstanceId: auth.userInstanceId,
        loginFrom: auth.loginFrom,
        accessRule: auth.accessRule,
        isAdmin: auth.isAdmin,
        ...getRuntimeMisc(),
      },
      flags: this.kernel.getFeatureFlags(),
      segues: this.segues,
      storyboardContext: this.storyboardContextWrapper.get(),
      tplContextId,
      formContextId,
    };
    return context;
  }

  getCurrentContext(): PluginRuntimeContext {
    return this.getContext({
      match: this.currentMatch,
    });
  }

  private matchRoutes(routes: RouteConf[], app: MicroApp): MatchRoutesResult {
    for (const route of routes) {
      const computedPath = computeRealRoutePath(route.path, app);
      if ([].concat(computedPath).includes(undefined)) {
        // eslint-disable-next-line no-console
        console.error("Invalid route with invalid path:", route);
        return "missed";
      }
      const match = matchPath(this.location.pathname, {
        path: computedPath,
        exact: route.exact,
        checkIf: (context) => looseCheckIf(route, context),
        getContext: (match) => this.getContext({ match }),
      });
      if (match !== null) {
        if (app.noAuthGuard || route.public || isLoggedIn()) {
          this.currentMatch = match;
          return { match, route };
        }
        return "unauthenticated";
      }
    }
    return "missed";
  }

  matchStoryboard(storyboards: RuntimeStoryboard[]): RuntimeStoryboard {
    return matchStoryboard(storyboards, this.location.pathname);
  }

  getSubStoryboardByRoute(storyboard: Storyboard): Storyboard {
    const matcher: SubStoryboardMatcher = (routes) => {
      const matched = this.matchRoutes(routes, storyboard.app);
      return isObject(matched) ? [matched.route] : [];
    };
    return getSubStoryboardByRoute(storyboard, matcher);
  }

  async mountRoutes(
    routes: RouteConf[],
    slotId?: string,
    mountRoutesResult?: MountRoutesResult
  ): Promise<MountRoutesResult> {
    const matched = this.matchRoutes(routes, this.kernel.nextApp);
    let redirect: string | ResolveConf;
    const redirectConf: RedirectConf = {};
    let context: PluginRuntimeContext;
    let route: RouteConf;
    switch (matched) {
      case "missed":
        break;
      case "unauthenticated":
        mountRoutesResult.flags.unauthenticated = true;
        break;
      default:
        mountRoutesResult.route = route = matched.route;
        if (route.segues) {
          Object.assign(this.segues, route.segues);
        }
        if (route.hybrid) {
          mountRoutesResult.flags.hybrid = true;
        }
        context = this.getContext({ match: matched.match });
        this.resolver.defineResolves(route.defineResolves, context);
        await this.mountProviders(
          route.providers,
          matched.match,
          slotId,
          mountRoutesResult
        );

        await this.storyboardContextWrapper.define(route.context, context);
        await this.preCheckPermissions(route, context);

        redirect = computeRealValue(route.redirect, context, true) as
          | string
          | ResolveConf;

        if (redirect) {
          if (typeof redirect === "string") {
            // Directly redirect.
            mountRoutesResult.flags.redirect = {
              path: redirect,
            };
            break;
          } else {
            // Resolvable redirect.
            await this.resolver.resolveOne("reference", redirect, redirectConf);
            if (redirectConf.redirect) {
              mountRoutesResult.flags.redirect = {
                path: redirectConf.redirect,
              };
              break;
            }
          }
        }

        await this.mountMenu(route.menu, matched.match, mountRoutesResult);

        if (route.documentId) {
          mountRoutesResult.appBar.documentId = route.documentId;
        }

        if (isRouteConfOfRoutes(route) && Array.isArray(route.routes)) {
          await this.preFetchMenu(route.context);
          await this.mountRoutes(route.routes, slotId, mountRoutesResult);
        } else if (isRouteConfOfBricks(route) && Array.isArray(route.bricks)) {
          await this.preFetchMenu(route);
          await this.mountBricks(
            route.bricks,
            matched.match,
            slotId,
            mountRoutesResult
          );

          // analytics data (page_view event)
          if (route.analyticsData) {
            mountRoutesResult.analyticsData = computeRealValue(
              route.analyticsData,
              context,
              true
            ) as Record<string, unknown>;
          }
        }
    }
    return mountRoutesResult;
  }

  private async mountMenu(
    menuConf: MenuConf,
    match: MatchResult,
    mountRoutesResult: MountRoutesResult
  ): Promise<void> {
    if (menuConf === false) {
      // `route.menu` 设置为 `false` 表示不显示顶栏和侧栏。
      mountRoutesResult.flags.barsHidden = true;
      return;
    }

    // `route.menu` 留空表示不做处理。
    if (!menuConf) {
      return;
    }

    const context = this.getContext({ match });

    if (menuConf.type === "brick") {
      // eslint-disable-next-line no-console
      console.warn(
        "menu type `brick` is deprecated, please use menu type `resolve` instead"
      );
      // 如果某个路由的菜单无法配置为静态的 json，
      // 那么可以将菜单配置指定为一个构件，这个构件会被装载到背景容器中（不会在界面中显示），
      // 应该在这个构件的 `connectedCallback` 中执行相关菜单设置，
      // 例如 `getRuntime().menuBar.setAppMenu(...)`。
      const brick: RuntimeBrick = {
        type: menuConf.brick,
        properties: computeRealProperties(
          menuConf.properties,
          context,
          menuConf.injectDeep !== false
        ),
        events: isObject(menuConf.events) ? menuConf.events : {},
        context,
        children: [],
      };

      this.registerHandlersFromLifeCycle(menuConf.lifeCycle, brick, match);

      // Then, resolve the brick.
      await this.resolver.resolve(menuConf, brick, context);

      mountRoutesResult.menuInBg.push(brick);
      return;
    }

    let injectDeep = (menuConf as StaticMenuProps).injectDeep;
    if (menuConf.type === "resolve") {
      await this.resolver.resolveOne(
        "reference",
        {
          transformMapArray: false,
          ...menuConf.resolve,
        },
        menuConf,
        null,
        context
      );
      injectDeep = false;
    }

    // 静态菜单配置，仅在有值时才设置，这样可以让菜单设置也具有按路由层级覆盖的能力。
    const otherMenuConf = omit(menuConf, ["injectDeep", "type"]);
    const injectedMenuConf =
      injectDeep !== false
        ? computeRealValue(otherMenuConf, context, true)
        : otherMenuConf;
    const { sidebarMenu, pageTitle, breadcrumb, menuId, subMenuId } =
      injectedMenuConf as StaticMenuConf;

    if (menuId) {
      mountRoutesResult.menuBar.menuId = menuId;
      mountRoutesResult.menuBar.menu = sidebarMenu;
    } else if (sidebarMenu) {
      mountRoutesResult.menuBar.menu = sidebarMenu;
      mountRoutesResult.menuBar.menuId = null;
    }
    if (subMenuId) {
      mountRoutesResult.menuBar.subMenuId = subMenuId;
    }
    if (pageTitle) {
      mountRoutesResult.appBar.pageTitle = pageTitle;
    }
    if (breadcrumb) {
      if (breadcrumb.overwrite) {
        mountRoutesResult.appBar.breadcrumb = breadcrumb.items;
      } else {
        mountRoutesResult.appBar.breadcrumb = [
          ...mountRoutesResult.appBar.breadcrumb,
          ...breadcrumb.items,
        ];
      }
      if (hasOwnProperty(breadcrumb, "noCurrentApp"))
        mountRoutesResult.appBar.noCurrentApp = breadcrumb.noCurrentApp;
    }
  }

  private async mountProviders(
    providers: ProviderConf[],
    match: MatchResult,
    slotId: string,
    mountRoutesResult: MountRoutesResult
  ): Promise<void> {
    if (Array.isArray(providers)) {
      for (const providerConf of providers) {
        await this.mountBrick(
          {
            ...(typeof providerConf === "string"
              ? {
                  brick: providerConf,
                }
              : providerConf),
            bg: true,
            injectDeep: true,
          },
          match,
          slotId,
          mountRoutesResult
        );
      }
    }
  }

  private async mountBricks(
    bricks: BrickConf[],
    match: MatchResult,
    slotId: string,
    mountRoutesResult: MountRoutesResult,
    tplStack?: Map<string, number>
  ): Promise<void> {
    for (const brickConf of bricks) {
      try {
        await this.mountBrick(
          brickConf,
          match,
          slotId,
          mountRoutesResult,
          tplStack && new Map(tplStack)
        );
      } catch (error) {
        if (error instanceof ResolveRequestError) {
          const errorMessage = httpErrorToString(error.rawError);
          const brickName = brickConf.template || brickConf.brick;
          const isLegacyTemplate = !!brickConf.template;
          mountRoutesResult.main.push({
            type: "basic-bricks.brick-error",
            properties: {
              // `textContent` is for compatibility when
              // `basic-bricks.brick-error` does not exists.
              textContent: `${
                isLegacyTemplate ? "Legacy template" : "Brick"
              } <${brickName}> ResolveRequestError: "${errorMessage}"`,
              errorType: "ResolveRequestError",
              errorMessage,
              brickName,
              isLegacyTemplate,
            },
            events: {},
            slotId,
          });
        } else {
          throw error;
        }
      }
    }
  }

  private async checkResolvableIf(
    ifContainer: IfContainer,
    context: PluginRuntimeContext
  ): Promise<boolean> {
    if (isObject(ifContainer.if)) {
      const ifChecked = computeRealValue(ifContainer.if, context, true);

      const ifConf: IfContainer = {};
      await this.resolver.resolveOne(
        "reference",
        ifChecked as ResolveConf,
        ifConf
      );
      return !hasOwnProperty(ifConf, "if") || !!ifConf.if;
    }

    return looseCheckIf(ifContainer, context);
  }

  private async preCheckPermissions(
    container: BrickConf | RouteConf,
    context: PluginRuntimeContext
  ): Promise<void> {
    if (
      isLoggedIn() &&
      !getAuth().isAdmin &&
      container.permissionsPreCheck &&
      Array.isArray(container.permissionsPreCheck)
    ) {
      const usedActions = computeRealValue(
        container.permissionsPreCheck,
        context,
        true
      );
      await validatePermissions(usedActions as string[]);
    }
  }

  async mountBrick(
    brickConf: BrickConf,
    match: MatchResult,
    slotId: string,
    mountRoutesResult: MountRoutesResult,
    tplStack = new Map<string, number>()
  ): Promise<void> {
    const tplContextId = (brickConf as RuntimeBrickConfWithTplSymbols)[
      symbolForTplContextId
    ];

    const formContextId = (brickConf as RuntimeBrickConfOfFormSymbols)[
      symbolForFormContextId
    ];

    const context = this.getContext({
      match,
      tplContextId,
      formContextId,
    });

    // First, check whether the brick should be rendered.
    if (!(await this.checkResolvableIf(brickConf, context))) {
      return;
    }

    // Then, resolve the template to a brick.
    if (brickConf.template) {
      await this.resolver.resolve(brickConf, null, context);
    }

    // Check `if` again for dynamic loaded templates.
    if (!(await this.checkResolvableIf(brickConf, context))) {
      return;
    }

    // If it's a custom template, `tplTagName` is the tag name of the template.
    // Otherwise, `tplTagName` is false.
    const tplTagName = getTagNameOfCustomTemplate(
      brickConf.brick,
      this.kernel.nextApp?.id
    );

    if (tplTagName) {
      const tplCount = tplStack.get(tplTagName) ?? 0;
      if (tplCount >= 10) {
        throw new Error(
          `Maximum custom template stack overflowed: "${tplTagName}"`
        );
      }
      tplStack.set(tplTagName, tplCount + 1);
    }

    if (brickConf.brick === formRenderer) {
      brickConf.properties.formData = JSON.stringify(
        brickConf.properties.formData
      );
    }
    const brick: RuntimeBrick = {};

    await this.storyboardContextWrapper.define(
      brickConf.context,
      context,
      brick
    );
    await this.preCheckPermissions(brickConf, context);

    const trackingContextList: TrackingContextItem[] = [];

    Object.assign(brick, {
      type: tplTagName || brickConf.brick,
      properties: computeRealProperties(
        brickConf.properties,
        context,
        brickConf.injectDeep !== false,
        trackingContextList
      ),
      events: isObject(brickConf.events) ? brickConf.events : {},
      context,
      children: [],
      slotId,
      refForProxy: (brickConf as RuntimeBrickConfWithTplSymbols)[
        symbolForRefForProxy
      ],
      tplContextId,
      formContextId,
      iid: brickConf.iid,
      ...(brickConf.lifeCycle?.onScrollIntoView
        ? {
            lifeCycle: {
              onScrollIntoView: brickConf.lifeCycle.onScrollIntoView,
            },
          }
        : {}),
    });

    if (
      (brickConf as RuntimeBrickConfWithTplSymbols)[
        symbolForComputedPropsFromProxy
      ]
    ) {
      Object.entries(
        (brickConf as RuntimeBrickConfWithTplSymbols)[
          symbolForComputedPropsFromProxy
        ]
      ).forEach(([propName, propValue]) => {
        set(brick.properties, propName, propValue);
      });
    }

    listenOnTrackingContext(brick, trackingContextList, context);

    if (brick.refForProxy) {
      brick.refForProxy.brick = brick;
    }

    this.registerHandlersFromLifeCycle(
      brickConf.lifeCycle,
      brick,
      match,
      tplContextId
    );

    if (brick.lifeCycle?.onScrollIntoView) {
      this.brickBindObserver(brick);
    }

    // Then, resolve the brick.
    await this.resolver.resolve(brickConf, brick, context);

    let expandedBrickConf = brickConf;
    const isBaseLayout: boolean = [
      "base-layout.tpl-homepage-base-module",
      "base-layout.tpl-base-page-module",
      "base-layout.tpl-homepage-base-module-cmdb",
      "base-layout.tpl-base-page-module-cmdb",
    ].includes(tplTagName as string);
    if (
      tplTagName &&
      (!isBaseLayout ||
        (this.kernel.getFeatureFlags()["support-ui-8.0-base-layout"] &&
          isBaseLayout))
    ) {
      await this.preFetchMenu(customTemplateRegistry.get(tplTagName)?.bricks);
      expandedBrickConf = await asyncExpandCustomTemplate(
        {
          ...brickConf,
          brick: tplTagName,
          // Properties are computed for custom templates.
          properties: brick.properties,
        },
        brick,
        context
      );

      // Try to load deps for dynamic added bricks.
      await this.kernel.loadDynamicBricksInBrickConf(expandedBrickConf);
    }

    if (brick.type === formRenderer) {
      const formData: formDataProperties = JSON.parse(
        brick.properties.formData
      );
      expandedBrickConf = await ExpandCustomForm(
        formData,
        brickConf,
        brick.properties.isPreview,
        context
      );
      await this.kernel.loadDynamicBricksInBrickConf(expandedBrickConf);
    }

    if (expandedBrickConf.exports) {
      for (const [prop, ctxName] of Object.entries(expandedBrickConf.exports)) {
        if (typeof ctxName === "string" && ctxName.startsWith("CTX.")) {
          this.storyboardContextWrapper.set(ctxName.substring(4), {
            type: "brick-property",
            brick,
            prop,
          });
        }
      }
    }

    if (expandedBrickConf.bg) {
      // A bg brick has no slotId.
      brick.slotId = undefined;
      appendBrick(brick, this.kernel.mountPoints.bg as MountableElement);
    } else {
      if (expandedBrickConf.portal) {
        // A portal brick has no slotId.
        brick.slotId = undefined;
        // Make parent portal bricks appear before child bricks.
        // This makes z-index of a child brick be higher than its parent.
        mountRoutesResult.portal.push(brick);
      }
      if (isObject(expandedBrickConf.slots)) {
        for (const [slotId, slotConf] of Object.entries(
          expandedBrickConf.slots
        )) {
          const slottedMountRoutesResult = {
            ...mountRoutesResult,
            main: brick.children,
          };
          if (slotConf.type === "bricks") {
            await this.mountBricks(
              slotConf.bricks,
              match,
              slotId,
              slottedMountRoutesResult,
              tplStack
            );
          } else if (slotConf.type === "routes") {
            await this.mountRoutes(
              slotConf.routes,
              slotId,
              slottedMountRoutesResult
            );
          }
        }
      }
      if (!expandedBrickConf.portal) {
        mountRoutesResult.main.push(brick);
      }
    }
  }

  private registerHandlersFromLifeCycle(
    lifeCycle: BrickLifeCycle,
    brick: RuntimeBrick,
    match: MatchResult,
    tplContextId?: string
  ): void {
    const {
      onBeforePageLoad,
      onPageLoad,
      onBeforePageLeave,
      onPageLeave,
      onAnchorLoad,
      onAnchorUnload,
      onMediaChange,
      onMessage,
      onMessageClose,
      onScrollIntoView,
    } = lifeCycle ?? {};

    if (onBeforePageLoad) {
      this.beforePageLoadHandlers.push({
        brick,
        match,
        tplContextId,
        handler: onBeforePageLoad,
      });
    }

    if (onPageLoad) {
      this.pageLoadHandlers.push({
        brick,
        match,
        tplContextId,
        handler: onPageLoad,
      });
    }

    if (onBeforePageLeave) {
      this.beforePageLeaveHandlers.push({
        brick,
        match,
        tplContextId,
        handler: onBeforePageLeave,
      });
    }

    if (onPageLeave) {
      this.pageLeaveHandlers.push({
        brick,
        match,
        tplContextId,
        handler: onPageLeave,
      });
    }

    if (onAnchorLoad) {
      this.anchorLoadHandlers.push({
        brick,
        match,
        tplContextId,
        handler: onAnchorLoad,
      });
    }

    if (onAnchorUnload) {
      this.anchorUnloadHandlers.push({
        brick,
        match,
        tplContextId,
        handler: onAnchorUnload,
      });
    }

    if (onMediaChange) {
      this.mediaChangeHandlers.push({
        brick,
        match,
        tplContextId,
        handler: onMediaChange,
      });
    }

    if (onMessage) {
      this.messageHandlers.push({
        brick,
        match,
        tplContextId,
        message: onMessage,
      });
    }

    if (onMessageClose) {
      this.messageCloseHandlers.push({
        brick,
        match,
        tplContextId,
        handler: onMessageClose,
      });
    }
    if (onScrollIntoView) {
      this.scrollIntoViewHandlersMap.set(brick.iid, {
        brick,
        match,
        tplContextId,
        handler: onScrollIntoView.handlers,
      });
    }
  }

  handleBeforePageLoad(): void {
    this.dispatchLifeCycleEvent(
      new CustomEvent("page.beforeLoad"),
      this.beforePageLoadHandlers
    );
  }

  handlePageLoad(): void {
    const event = new CustomEvent("page.load");

    this.dispatchLifeCycleEvent(event, this.pageLoadHandlers);

    // Currently only for e2e testing
    window.dispatchEvent(event);
  }

  handleBeforePageLeave(detail: {
    location?: Location<PluginHistoryState>;
    action?: Action;
  }): void {
    this.dispatchLifeCycleEvent(
      new CustomEvent("page.beforeLeave", {
        detail,
      }),
      this.beforePageLeaveHandlers
    );
  }

  handlePageLeave(): void {
    this.dispatchLifeCycleEvent(
      new CustomEvent("page.leave"),
      this.pageLeaveHandlers
    );
  }

  handleAnchorLoad(): void {
    const hash = getHistory().location.hash;
    if (hash && hash !== "#") {
      this.dispatchLifeCycleEvent(
        new CustomEvent("anchor.load", {
          detail: {
            hash,
            anchor: hash.substr(1),
          },
        }),
        this.anchorLoadHandlers
      );
    } else {
      this.dispatchLifeCycleEvent(
        new CustomEvent("anchor.unload"),
        this.anchorUnloadHandlers
      );
    }
  }

  handleMediaChange(detail: Media): void {
    this.dispatchLifeCycleEvent(
      new CustomEvent("media.change", { detail: getReadOnlyProxy(detail) }),
      this.mediaChangeHandlers
    );
  }

  handleMessage(): void {
    this.messageDispatcher.create(
      this.messageHandlers,
      this.getCurrentContext()
    );
  }

  handleMessageClose(event: CloseEvent): void {
    this.dispatchLifeCycleEvent(
      new CustomEvent<CloseEvent>("message.close", {
        detail: event,
      }),
      this.messageCloseHandlers
    );
  }
  handleScrollIntoView(id: string): void {
    const currentHandlers = this.scrollIntoViewHandlersMap.get(id);
    this.dispatchLifeCycleEvent(new CustomEvent("scroll.into.view"), [
      currentHandlers,
    ]);
  }
  handleBrickBindObserver(): void {
    this.observersList.forEach((value) => {
      value.$$observe();
    });
  }

  getCurrentMatch(): MatchResult {
    return this.currentMatch;
  }

  /** @deprecated */
  getTplContext(): void {
    // Keep it for compatibility only.
  }

  private dispatchLifeCycleEvent(
    event: CustomEvent,
    handlers: BrickAndLifeCycleHandler[]
  ): void {
    for (const brickAndHandler of handlers) {
      for (const handler of ([] as BrickEventHandler[]).concat(
        brickAndHandler.handler
      )) {
        listenerFactory(
          handler,
          this.getContext({
            match: brickAndHandler.match,
            tplContextId: brickAndHandler.tplContextId,
          }),
          brickAndHandler.brick
        )(event);
      }
    }
  }

  private async preFetchMenu(data: unknown): Promise<void> {
    const useMenus: string[] = scanAppGetMenuInAny(data);
    if (useMenus.length) {
      await preConstructMenus(useMenus, this.getCurrentContext(), this.kernel);
    }
  }

  private brickBindObserver(brick: RuntimeBrick): void {
    const threshold = brick.lifeCycle.onScrollIntoView.threshold ?? 0.1;
    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.intersectionRatio >= threshold) {
              this.handleScrollIntoView(brick.iid);
              observer.disconnect();
            }
          }
        });
      },
      {
        threshold,
      }
    );
    this.observersList.push({
      $$observe: () => observer.observe(brick.element),
    });
  }
}
