import { omit } from "lodash";
import {
  PluginLocation,
  MatchResult,
  RouteConf,
  RuntimeStoryboard,
  BrickConf,
  PluginHistoryState,
  SidebarMenu,
  MenuConf,
  BreadcrumbItemConf,
  MicroApp,
  ProviderConf,
  PluginRuntimeContext,
  BrickEventHandler,
  ResolveConf,
  RouteConfOfRoutes,
  RouteConfOfBricks,
  RuntimeBrickConf,
  StaticMenuProps,
  SeguesConf,
} from "@easyops/brick-types";
import {
  isObject,
  matchPath,
  computeRealRoutePath,
} from "@easyops/brick-utils";
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
} from "./exports";
import { RedirectConf, IfConf } from "./interfaces";

export type MatchRoutesResult =
  | {
      match: MatchResult;
      route: RouteConf;
    }
  | "missed"
  | "redirect";

export interface MountRoutesResult {
  main: RuntimeBrick[];
  menuInBg: RuntimeBrick[];
  menuBar: {
    app?: MicroApp;
    menu?: SidebarMenu;
  };
  portal: RuntimeBrick[];
  appBar: {
    app?: MicroApp;
    pageTitle?: string;
    breadcrumb?: BreadcrumbItemConf[];
  };
  flags: {
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
  handler: BrickEventHandler | BrickEventHandler[];
}

export class LocationContext {
  private readonly query: URLSearchParams;
  readonly resolver = new Resolver(this.kernel);
  private readonly pageLoadHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly anchorLoadHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly anchorUnloadHandlers: BrickAndLifeCycleHandler[] = [];
  private readonly segues: SeguesConf = {};
  private currentMatch: MatchResult;

  constructor(private kernel: Kernel, private location: PluginLocation) {
    this.query = new URLSearchParams(location.search);
  }

  private getContext(match: MatchResult): PluginRuntimeContext {
    const auth = getAuth();
    return {
      hash: this.location.hash,
      query: this.query,
      match,
      app: this.kernel.nextApp,
      sys: {
        org: auth.org,
        username: auth.username,
        userInstanceId: auth.userInstanceId,
      },
      flags: this.kernel.getFeatureFlags(),
      segues: this.segues,
    };
  }

  getCurrentContext(): PluginRuntimeContext {
    return this.getContext(this.currentMatch);
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
          return "redirect";
        }
      }
    }
    return "missed";
  }

  matchStoryboard(storyboards: RuntimeStoryboard[]): RuntimeStoryboard {
    for (const storyboard of storyboards) {
      const matched = this.matchRoutes(storyboard.routes, storyboard.app);
      if (matched !== "missed") {
        return storyboard;
      }
    }
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
    switch (matched) {
      case "missed":
        break;
      case "redirect":
        mountRoutesResult.flags.redirect = {
          path: "/auth/login",
          state: {
            from: this.location,
          },
        };
        break;
      default:
        if (matched.route.segues) {
          Object.assign(this.segues, matched.route.segues);
        }
        if (matched.route.hybrid) {
          mountRoutesResult.flags.hybrid = true;
        }
        context = this.getContext(matched.match);
        this.resolver.defineResolves(matched.route.defineResolves, context);
        await this.mountProviders(
          matched.route.providers,
          matched.match,
          slotId,
          mountRoutesResult
        );

        redirect = computeRealValue(matched.route.redirect, context, true);

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

        await this.mountMenu(
          matched.route.menu,
          matched.match,
          mountRoutesResult
        );

        if (matched.route.type === "routes") {
          await this.mountRoutes(
            (matched.route as RouteConfOfRoutes).routes,
            slotId,
            mountRoutesResult
          );
        } else if (Array.isArray((matched.route as RouteConfOfBricks).bricks)) {
          await this.mountBricks(
            (matched.route as RouteConfOfBricks).bricks,
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

    const context = this.getContext(match);

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

      if (menuConf.lifeCycle?.onPageLoad) {
        this.pageLoadHandlers.push({
          brick,
          match,
          handler: menuConf.lifeCycle.onPageLoad,
        });
      }

      if (menuConf.lifeCycle?.onAnchorLoad) {
        this.anchorLoadHandlers.push({
          brick,
          match,
          handler: menuConf.lifeCycle.onAnchorLoad,
        });
      }

      if (menuConf.lifeCycle?.onAnchorUnload) {
        this.anchorUnloadHandlers.push({
          brick,
          match,
          handler: menuConf.lifeCycle.onAnchorUnload,
        });
      }

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
        ? computeRealProperties(otherMenuConf, context, true)
        : otherMenuConf;
    const { sidebarMenu, pageTitle, breadcrumb } = injectedMenuConf;

    if (sidebarMenu !== undefined) {
      mountRoutesResult.menuBar.menu = sidebarMenu;
    }
    if (pageTitle !== undefined) {
      mountRoutesResult.appBar.pageTitle = pageTitle;
    }
    if (breadcrumb !== undefined) {
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
    mountRoutesResult: MountRoutesResult
  ): Promise<void> {
    for (const brickConf of bricks) {
      await this.mountBrick(brickConf, match, slotId, mountRoutesResult);
    }
  }

  private async checkIf(
    rawIf: string | boolean | ResolveConf,
    context: PluginRuntimeContext
  ): Promise<boolean> {
    if (
      isObject(rawIf) ||
      typeof rawIf === "boolean" ||
      typeof rawIf === "string"
    ) {
      const ifChecked = computeRealValue(rawIf, context, true);

      if (isObject(ifChecked)) {
        const ifConf: IfConf = {};
        await this.resolver.resolveOne("reference", ifChecked, ifConf);
        if (ifConf.if === false) {
          return false;
        }
        // istanbul ignore if
        if (typeof ifConf.if !== "boolean") {
          // eslint-disable-next-line no-console
          console.warn("Received an unexpected condition result:", ifConf.if);
        }
      } else if (ifChecked === false) {
        return false;
      } /* istanbul ignore if */ else if (typeof ifChecked !== "boolean") {
        // eslint-disable-next-line no-console
        console.warn("Received an unexpected condition result:", ifChecked);
      }
    }

    return true;
  }

  async mountBrick(
    brickConf: BrickConf,
    match: MatchResult,
    slotId: string,
    mountRoutesResult: MountRoutesResult
  ): Promise<void> {
    const context = this.getContext(match);

    // First, check whether the brick should be rendered.
    if (!(await this.checkIf(brickConf.if, context))) {
      return;
    }

    // Then, resolve the template to a brick.
    if (brickConf.template) {
      await this.resolver.resolve(brickConf, null, context);
    }

    // Check `if` again for dynamic loaded templates.
    if (!(await this.checkIf(brickConf.if, context))) {
      return;
    }

    // If it's a custom template, `tplTagName` is the tag name of the template.
    // Otherwise, `tplTagName` is false.
    const tplTagName = getTagNameOfCustomTemplate(
      brickConf.brick,
      this.kernel.nextApp?.id
    );

    const brick: RuntimeBrick = {
      type: tplTagName || brickConf.brick,
      properties: Object.assign(
        computeRealProperties(
          brickConf.properties,
          context,
          brickConf.injectDeep !== false
        ),
        (brickConf as RuntimeBrickConf).$$computedPropsFromProxy
      ),
      events: isObject(brickConf.events) ? brickConf.events : {},
      context,
      children: [],
      slotId,
      refForProxy: (brickConf as RuntimeBrickConf).$$refForProxy,
    };

    if (brick.refForProxy) {
      brick.refForProxy.brick = brick;
    }

    if (brickConf.lifeCycle?.onPageLoad) {
      this.pageLoadHandlers.push({
        brick,
        match,
        handler: brickConf.lifeCycle.onPageLoad,
      });
    }

    if (brickConf.lifeCycle?.onAnchorLoad) {
      this.anchorLoadHandlers.push({
        brick,
        match,
        handler: brickConf.lifeCycle.onAnchorLoad,
      });
    }

    if (brickConf.lifeCycle?.onAnchorUnload) {
      this.anchorUnloadHandlers.push({
        brick,
        match,
        handler: brickConf.lifeCycle.onAnchorUnload,
      });
    }

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
        brick
      );

      // Try to load deps for dynamic added bricks.
      await this.kernel.loadDynamicBricks(expandedBrickConf);
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
              slottedMountRoutesResult
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

  handlePageLoad(): void {
    this.dispatchLifeCycleEvent(
      new CustomEvent("page.load"),
      this.pageLoadHandlers
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
          this.getContext(brickAndHandler.match),
          brickAndHandler.brick.element
        )(event);
      }
    }
  }
}
