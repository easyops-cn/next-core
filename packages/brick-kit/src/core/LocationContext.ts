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
  MicroApp
} from "@easyops/brick-types";
import {
  isObject,
  computeRealProperties,
  matchPath,
  computeRealRoutePath
} from "@easyops/brick-utils";
import { RuntimeBrick, Kernel, appendBrick, Resolver } from "./exports";
import { isLoggedIn } from "../auth";
import { MountableElement } from "./reconciler";

export type MatchRoutesResult =
  | {
      match: MatchResult;
      route: RouteConf;
    }
  | "missed"
  | "redirect";

export interface MountRoutesResult {
  redirect?: {
    path: string;
    state: PluginHistoryState;
  };
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
  barsHidden?: boolean;
  hybrid?: boolean;
}

export class LocationContext {
  readonly location: PluginLocation;
  readonly query: URLSearchParams;
  readonly hash: string;
  readonly resolver = new Resolver(this.kernel);

  constructor(private kernel: Kernel, location: PluginLocation) {
    this.location = location;
    this.query = new URLSearchParams(location.search);
    this.hash = location.hash;
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
        mountRoutesResult.redirect = {
          path: "/auth/login",
          state: {
            from: this.location
          }
        };
        break;
      default:
        if (matched.route.hybrid) {
          mountRoutesResult.hybrid = true;
        }
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
      mountRoutesResult.barsHidden = true;
      return;
    }

    // `route.menu` 留空表示不做处理。
    if (!menuConf) {
      return;
    }

    if (menuConf.type === "brick") {
      // 如果某个路由的菜单无法配置为静态的 json，
      // 那么可以将菜单配置指定为一个构件，这个构件会被装载到背景容器中（不会在界面中显示），
      // 应该在这个构件的 `connectedCallback` 中执行相关菜单设置，
      // 例如 `getRuntime().menuBar.setAppMenu(...)`。
      const brick: RuntimeBrick = {
        type: menuConf.brick,
        properties: computeRealProperties(
          menuConf.properties,
          {
            query: this.query,
            match,
            app: this.kernel.nextApp
          },
          menuConf.injectDeep
        ),
        events: isObject(menuConf.events) ? menuConf.events : {},
        context: {
          query: this.query,
          match,
          app: this.kernel.nextApp
        },
        children: []
      };
      mountRoutesResult.menuInBg.push(brick);
      return;
    }

    // 静态菜单配置，仅在有值时才设置，这样可以让菜单设置也具有按路由层级覆盖的能力。
    const { injectDeep, ...otherMenuConf } = menuConf;
    const injectedMenuConf = injectDeep
      ? computeRealProperties(
          otherMenuConf,
          {
            query: this.query,
            match,
            app: this.kernel.nextApp
          },
          true
        )
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
    const context = {
      hash: this.hash,
      query: this.query,
      match,
      app: this.kernel.nextApp
    };

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
          brickConf.injectDeep
        ),
        match
      },
      events: isObject(brickConf.events) ? brickConf.events : {},
      context,
      children: [],
      slotId
    };

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
}
