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
  BrickLifeCycle,
  BrickEventHandler,
  CustomBrickEventHandler
} from "@easyops/brick-types";
import {
  isObject,
  computeRealProperties,
  matchPath,
  computeRealRoutePath,
  listenerFactory
} from "@easyops/brick-utils";
import { RuntimeBrick, Kernel, appendBrick, Resolver } from "./exports";
import { isLoggedIn } from "../auth";
import { MountableElement } from "./reconciler";
import { getHistory } from "../history";

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
  appBar: {
    app?: MicroApp;
    pageTitle?: string;
    breadcrumb?: BreadcrumbItemConf[];
  };
  flags: {
    redirect?: {
      path: string;
      state: PluginHistoryState;
    };
    barsHidden?: boolean;
    hybrid?: boolean;
    failed?: boolean;
  };
}

interface PageLoadHandler {
  brick: RuntimeBrick;
  onPageLoad: BrickLifeCycle["onPageLoad"];
}

export class LocationContext {
  readonly location: PluginLocation;
  readonly query: URLSearchParams;
  readonly resolver = new Resolver(this.kernel);
  private readonly pageLoadHandlers: PageLoadHandler[] = [];

  constructor(private kernel: Kernel, location: PluginLocation) {
    this.location = location;
    this.query = new URLSearchParams(location.search);
  }

  private getContext(match: MatchResult): PluginRuntimeContext {
    return {
      hash: this.location.hash,
      query: this.query,
      match,
      app: this.kernel.nextApp
    };
  }

  private matchRoutes(routes: RouteConf[], app: MicroApp): MatchRoutesResult {
    for (const route of routes) {
      const match = matchPath(this.location.pathname, {
        path: computeRealRoutePath(route.path, app),
        exact: route.exact
      });
      if (match !== null) {
        if (route.public || isLoggedIn()) {
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
    switch (matched) {
      case "missed":
        break;
      case "redirect":
        mountRoutesResult.flags.redirect = {
          path: "/auth/login",
          state: {
            from: this.location
          }
        };
        break;
      default:
        if (matched.route.hybrid) {
          mountRoutesResult.flags.hybrid = true;
        }
        this.resolver.defineResolves(matched.route.defineResolves);
        await this.mountProviders(
          matched.route.providers,
          matched.match,
          slotId,
          mountRoutesResult
        );
        this.mountMenu(matched.route.menu, matched.match, mountRoutesResult);
        await this.mountBricks(
          matched.route.bricks,
          matched.match,
          slotId,
          mountRoutesResult
        );
        break;
    }
    return mountRoutesResult;
  }

  private mountMenu(
    menuConf: MenuConf,
    match: MatchResult,
    mountRoutesResult: MountRoutesResult
  ): void {
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
        children: []
      };
      mountRoutesResult.menuInBg.push(brick);
      return;
    }

    // 静态菜单配置，仅在有值时才设置，这样可以让菜单设置也具有按路由层级覆盖的能力。
    const { injectDeep, ...otherMenuConf } = menuConf;
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
          ...breadcrumb.items
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
                  brick: providerConf
                }
              : providerConf),
            bg: true,
            injectDeep: true
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

  async mountBrick(
    brickConf: BrickConf,
    match: MatchResult,
    slotId: string,
    mountRoutesResult: MountRoutesResult
  ): Promise<void> {
    const context = this.getContext(match);

    // First, resolve the template to a brick.
    if (brickConf.template) {
      await this.resolver.resolve(brickConf, null, context);
    }

    const brick: RuntimeBrick = {
      type: brickConf.brick,
      properties: {
        ...computeRealProperties(
          brickConf.properties,
          context,
          brickConf.injectDeep !== false
        ),
        match
      },
      events: isObject(brickConf.events) ? brickConf.events : {},
      context,
      children: [],
      slotId
    };

    if (brickConf.lifeCycle?.onPageLoad) {
      this.pageLoadHandlers.push({
        brick,
        onPageLoad: brickConf.lifeCycle.onPageLoad
      });
    }

    // Then, resolve the brick.
    await this.resolver.resolve(brickConf, brick, context);

    if (brickConf.bg) {
      appendBrick(brick, this.kernel.mountPoints.bg as MountableElement);
    } else {
      if (isObject(brickConf.slots)) {
        for (const [slotId, slotConf] of Object.entries(brickConf.slots)) {
          const slottedMountRoutesResult = {
            ...mountRoutesResult,
            main: brick.children
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
      mountRoutesResult.main.push(brick);
    }
  }

  handlePageLoad(): void {
    const history = getHistory();
    const event = new CustomEvent("page.load");
    for (const pageLoadHandler of this.pageLoadHandlers) {
      for (const handler of ([] as BrickEventHandler[]).concat(
        pageLoadHandler.onPageLoad
      )) {
        listenerFactory(
          (handler as CustomBrickEventHandler).target === "_self"
            ? {
                ...handler,
                target: pageLoadHandler.brick.element
              }
            : handler,
          history,
          this.getContext(null)
        )(event);
      }
    }
  }
}
