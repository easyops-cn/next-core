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
import { isLoggedIn } from "../auth";
import {
  isObject,
  computeRealProperties,
  matchPath,
  computeRealRoutePath
} from "@easyops/brick-utils";
import { RuntimeBrick, Kernel } from "./exports";

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
  bg: RuntimeBrick[];
  all: RuntimeBrick[];
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
}

export class LocationContext {
  readonly location: PluginLocation;
  readonly query: URLSearchParams;

  constructor(private kernel: Kernel, location: PluginLocation) {
    this.location = location;
    this.query = new URLSearchParams(location.search);
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

  mountRoutes(
    routes: RouteConf[],
    slotId?: string,
    mountRoutesResult?: MountRoutesResult
  ): MountRoutesResult {
    if (mountRoutesResult === undefined) {
      mountRoutesResult = {
        main: [],
        bg: [],
        all: [],
        menuBar: {
          app: this.kernel.currentApp
        },
        appBar: {
          app: this.kernel.currentApp,
          breadcrumb: this.kernel.appBar.element.breadcrumb
        },
        redirect: undefined
      };
    }
    const matched = this.matchRoutes(routes, this.kernel.currentApp);
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
        this.mountMenu(matched.route.menu, matched.match, mountRoutesResult);
        this.mountBricks(
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
            match
          },
          menuConf.injectDeep
        ),
        events: isObject(menuConf.events) ? menuConf.events : {},
        context: {
          query: this.query,
          match
        },
        children: []
      };
      mountRoutesResult.bg.push(brick);
      return;
    }

    // 静态菜单配置，仅在有值时才设置，这样可以让菜单设置也具有按路由层级覆盖的能力。
    const { injectDeep, ...otherMenuConf } = menuConf;
    const injectedMenuConf = injectDeep
      ? computeRealProperties(
          otherMenuConf,
          {
            query: this.query,
            match
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

  private mountBricks(
    bricks: BrickConf[],
    match: MatchResult,
    slotId: string,
    mountRoutesResult: MountRoutesResult
  ): void {
    bricks.forEach(brickConf => {
      const brick: RuntimeBrick = {
        type: brickConf.brick,
        properties: {
          ...computeRealProperties(
            brickConf.properties,
            {
              query: this.query,
              match
            },
            brickConf.injectDeep
          ),
          match
        },
        events: isObject(brickConf.events) ? brickConf.events : {},
        context: {
          query: this.query,
          match
        },
        children: [],
        slotId,
        lifeCycle: brickConf.lifeCycle,
        bg: !!brickConf.bg
      };
      if (isObject(brickConf.slots)) {
        const children: RuntimeBrick[] = [];
        for (const [slotId, slotConf] of Object.entries(brickConf.slots)) {
          const slottedMountRoutesResult = {
            ...mountRoutesResult,
            main: children
          };
          if (slotConf.type === "bricks") {
            this.mountBricks(
              slotConf.bricks,
              match,
              slotId,
              slottedMountRoutesResult
            );
          } else if (slotConf.type === "routes") {
            this.mountRoutes(slotConf.routes, slotId, slottedMountRoutesResult);
          }
        }
        brick.children = children;
      }
      if (brickConf.bg) {
        mountRoutesResult.bg.push(brick);
      } else {
        mountRoutesResult.main.push(brick);
      }
      mountRoutesResult.all.push(brick);
    });
  }
}
