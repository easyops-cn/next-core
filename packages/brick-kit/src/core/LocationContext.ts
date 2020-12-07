import { omit, set } from "lodash";
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
  RouteConfOfRoutes,
  RouteConfOfBricks,
  StaticMenuProps,
  SeguesConf,
  ContextConf,
  StoryboardContext,
  StoryboardContextItem,
  MessageConf,
  BrickLifeCycle,
  Storyboard,
  StaticMenuConf,
} from "@easyops/brick-types";
import {
  isObject,
  matchPath,
  computeRealRoutePath,
  hasOwnProperty,
} from "@easyops/brick-utils";
import { Action, Location } from "history";
import { listenerFactory } from "../bindListeners";
import { computeRealProperties, computeRealValue } from "../setProperties";
import { isLoggedIn, getAuth } from "../auth";
import { getHistory } from "../history";
import {
  RuntimeBrick,
  Kernel,
  appendBrick,
  Resolver,
  expandCustomTemplate,
  MountableElement,
  getTagNameOfCustomTemplate,
  symbolForComputedPropsFromProxy,
  symbolForRefForProxy,
  symbolForParentTemplate,
  ResolveRequestError,
  RuntimeBrickConfWithTplSymbols,
  CustomTemplateContext,
} from "./exports";
import { RedirectConf } from "./interfaces";
import { looseCheckIf, IfContainer } from "../checkIf";
import { getMessageDispatcher, MessageDispatcher } from "./MessageDispatcher";
import { getRuntimeMisc } from "../misc";
import { httpErrorToString } from "../handleHttpError";
import {
  getSubStoryboardByRoute,
  SubStoryboardMatcher,
} from "./getSubStoryboardByRoute";
import { symbolForTplContextId } from "./CustomTemplates";

export type MatchRoutesResult =
  | {
      match: MatchResult;
      route: RouteConf;
    }
  | "missed"
  | "unauthenticated";

export interface MountRoutesResult {
  main: RuntimeBrick[];
  menuInBg: RuntimeBrick[];
  menuBar: {
    menu?: SidebarMenu;
    subMenu?: SidebarSubMenu;
    menuId?: string;
    subMenuId?: string;
  };
  portal: RuntimeBrick[];
  appBar: {
    pageTitle?: string;
    breadcrumb: BreadcrumbItemConf[];
    documentId?: string;
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

export class LocationContext {
  private readonly query: URLSearchParams;
  readonly resolver = new Resolver(this.kernel);
  readonly messageDispatcher: MessageDispatcher;
  private readonly beforePageLoadHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly pageLoadHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly beforePageLeaveHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly pageLeaveHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly anchorLoadHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly anchorUnloadHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly messageCloseHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly messageHandlers: BrickAndMessage[] = [];
  private readonly segues: SeguesConf = {};
  private currentMatch: MatchResult;
  private readonly storyboardContext: StoryboardContext = new Map();
  private readonly tplContext = new CustomTemplateContext();

  constructor(private kernel: Kernel, private location: PluginLocation) {
    this.query = new URLSearchParams(location.search);
    this.messageDispatcher = getMessageDispatcher();
  }

  private getContext({
    match,
    tplContextId,
  }: {
    match: MatchResult;
    tplContextId?: string;
  }): PluginRuntimeContext {
    const auth = getAuth();
    const context: PluginRuntimeContext = {
      hash: this.location.hash,
      query: this.query,
      match,
      app: this.kernel.nextApp,
      images: this.kernel.nextAppMeta?.images,
      sys: {
        org: auth.org,
        username: auth.username,
        userInstanceId: auth.userInstanceId,
        loginFrom: auth.loginFrom,
        ...getRuntimeMisc(),
      },
      flags: this.kernel.getFeatureFlags(),
      segues: this.segues,
      storyboardContext: this.storyboardContext,
    };
    if (tplContextId) {
      context.getTplVariables = () => this.tplContext.getContext(tplContextId);
    }
    return context;
  }

  getCurrentContext(): PluginRuntimeContext {
    return this.getContext({
      match: this.currentMatch,
    });
  }

  private async defineStoryboardFreeContext(
    contextConfs: ContextConf[],
    coreContext: PluginRuntimeContext,
    brick?: RuntimeBrick
  ): Promise<void> {
    for (const contextConf of contextConfs) {
      let value: unknown;
      if (contextConf.property) {
        if (brick) {
          this.setStoryboardContext(contextConf.name, {
            type: "brick-property",
            brick,
            prop: contextConf.property,
          });
        }
      } else {
        if (contextConf.resolve) {
          const valueConf: Record<string, unknown> = {};
          await this.resolver.resolveOne(
            "reference",
            {
              transform: "value",
              transformMapArray: false,
              ...contextConf.resolve,
            },
            valueConf,
            null,
            coreContext
          );
          value = valueConf.value;
        } else {
          value = computeRealValue(contextConf.value, coreContext, true);
        }
        this.setStoryboardContext(contextConf.name, {
          type: "free-variable",
          value,
        });
      }
    }
  }

  private setStoryboardContext(
    name: string,
    item: StoryboardContextItem
  ): void {
    if (this.storyboardContext.has(name)) {
      // eslint-disable-next-line no-console
      console.warn(
        `Storyboard context "${name}" have already existed, it will be replaced.`
      );
    }
    this.storyboardContext.set(name, item);
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
      });
      if (match !== null) {
        if (route.public || isLoggedIn()) {
          this.currentMatch = match;
          return { match, route };
        } else {
          return "unauthenticated";
        }
      }
    }
    return "missed";
  }

  matchStoryboard(storyboards: RuntimeStoryboard[]): RuntimeStoryboard {
    for (const storyboard of storyboards) {
      const homepage = storyboard.app?.homepage;
      if (typeof homepage === "string" && homepage[0] === "/") {
        if (
          matchPath(this.location.pathname, {
            path: homepage,
            exact: homepage === "/",
          })
        ) {
          return storyboard;
        }
      }
    }
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
        route = matched.route;
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

        if (Array.isArray(route.context)) {
          await this.defineStoryboardFreeContext(route.context, context);
        }

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

        if (route.type === "routes") {
          await this.mountRoutes(
            (route as RouteConfOfRoutes).routes,
            slotId,
            mountRoutesResult
          );
        } else if (Array.isArray((route as RouteConfOfBricks).bricks)) {
          await this.mountBricks(
            (route as RouteConfOfBricks).bricks,
            matched.match,
            slotId,
            mountRoutesResult
          );
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
    const {
      sidebarMenu,
      pageTitle,
      breadcrumb,
      menuId,
      subMenuId,
    } = injectedMenuConf as StaticMenuConf;

    if (menuId) {
      mountRoutesResult.menuBar.menuId = menuId;
      mountRoutesResult.menuBar.menu = null;
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
    tplStack?: string[]
  ): Promise<void> {
    for (const brickConf of bricks) {
      try {
        await this.mountBrick(
          brickConf,
          match,
          slotId,
          mountRoutesResult,
          tplStack?.slice()
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

  async mountBrick(
    brickConf: BrickConf,
    match: MatchResult,
    slotId: string,
    mountRoutesResult: MountRoutesResult,
    tplStack: string[] = []
  ): Promise<void> {
    const tplContextId = (brickConf as RuntimeBrickConfWithTplSymbols)[
      symbolForTplContextId
    ];
    const context = this.getContext({
      match,
      tplContextId,
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
      if (tplStack.includes(tplTagName)) {
        throw new Error(`Circular custom template: "${tplTagName}"`);
      }
      tplStack.push(tplTagName);
    }

    const brick: RuntimeBrick = {};

    if (Array.isArray(brickConf.context)) {
      await this.defineStoryboardFreeContext(brickConf.context, context, brick);
    }

    Object.assign(brick, {
      type: tplTagName || brickConf.brick,
      properties: computeRealProperties(
        brickConf.properties,
        context,
        brickConf.injectDeep !== false
      ),
      events: isObject(brickConf.events) ? brickConf.events : {},
      context,
      children: [],
      slotId,
      refForProxy: (brickConf as RuntimeBrickConfWithTplSymbols)[
        symbolForRefForProxy
      ],
      parentTemplate: (brickConf as RuntimeBrickConfWithTplSymbols)[
        symbolForParentTemplate
      ],
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

    if (brick.refForProxy) {
      brick.refForProxy.brick = brick;
    }

    this.registerHandlersFromLifeCycle(
      brickConf.lifeCycle,
      brick,
      match,
      tplContextId
    );

    // Then, resolve the brick.
    await this.resolver.resolve(brickConf, brick, context);

    let expandedBrickConf = brickConf;
    if (tplTagName) {
      expandedBrickConf = expandCustomTemplate(
        {
          ...brickConf,
          brick: tplTagName,
          // Properties are computed for custom templates.
          properties: brick.properties,
        },
        brick,
        context,
        this.tplContext
      );

      // Try to load deps for dynamic added bricks.
      await this.kernel.loadDynamicBricksInBrickConf(expandedBrickConf);
    }

    if (expandedBrickConf.exports) {
      for (const [prop, ctxName] of Object.entries(expandedBrickConf.exports)) {
        if (typeof ctxName === "string" && ctxName.startsWith("CTX.")) {
          this.setStoryboardContext(ctxName.substr(4), {
            type: "brick-property",
            brick,
            prop,
          });
        }
      }
    }

    if (expandedBrickConf.bg) {
      appendBrick(brick, this.kernel.mountPoints.bg as MountableElement);
    } else {
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
      if (expandedBrickConf.portal) {
        mountRoutesResult.portal.push(brick);
      } else {
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
      onMessage,
      onMessageClose,
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
  }

  handleBeforePageLoad(): void {
    this.dispatchLifeCycleEvent(
      new CustomEvent("page.beforeLoad"),
      this.beforePageLoadHandlers
    );
  }

  handlePageLoad(): void {
    this.dispatchLifeCycleEvent(
      new CustomEvent("page.load"),
      this.pageLoadHandlers
    );
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
          brickAndHandler.brick.element
        )(event);
      }
    }
  }
}
