import { PluginLocation } from "@easyops/brick-types";
import { loadScript } from "@easyops/brick-utils";
import {
  LocationContext,
  mountTree,
  mountStaticNode,
  Kernel,
  MountableElement,
  Resolver
} from "./exports";
import { getHistory } from "../history";
import { httpErrorToString } from "../handleHttpError";
import { isUnauthenticatedError } from "../isUnauthenticatedError";

export class Router {
  private defaultCollapsed = false;
  private resolver = new Resolver();

  constructor(private kernel: Kernel) {}

  async bootstrap(): Promise<void> {
    getHistory().listen((location: PluginLocation) => {
      if (location.state && location.state.notify === false) {
        // No rendering if notify is `false`.
        return;
      }
      this.render(location);
    });
    await this.render(getHistory().location);
    this.kernel.firstRendered();
  }

  private render = async (location: PluginLocation): Promise<void> => {
    const history = getHistory();
    const locationContext = new LocationContext(this.kernel, location);
    const storyboard = locationContext.matchStoryboard(
      this.kernel.bootstrapData.storyboards
    );
    if (storyboard) {
      // 如果找到匹配的 storyboard，那么加载它的依赖库。
      if (storyboard.dependsAll) {
        const dllHash: Record<string, string> = (window as any).DLL_HASH || {};
        await loadScript(
          Object.entries(dllHash).map(
            ([name, hash]) => `dll-of-${name}.js?${hash}`
          )
        );
        await loadScript(
          this.kernel.bootstrapData.brickPackages.map(bp => bp.filePath)
        );
      } else {
        await loadScript(storyboard.dll);
        await loadScript(storyboard.deps);
      }
    }

    const { mountPoints, currentApp: previousApp } = this.kernel;
    const currentApp = storyboard ? storyboard.app : undefined;
    const appChanged = previousApp !== currentApp;
    const legacy = currentApp ? currentApp.legacy : undefined;

    this.kernel.unsetBars({ appChanged, legacy });
    this.kernel.toggleLegacyIframe(false);
    this.resolver.resetCache();
    this.resolver.resetRefreshQueue();

    if (appChanged) {
      this.kernel.currentApp = currentApp;
      window.dispatchEvent(
        new CustomEvent("app.change", {
          detail: {
            previousApp,
            currentApp
          }
        })
      );
    }

    if (storyboard) {
      let {
        redirect,
        main,
        bg,
        all,
        menuBar,
        appBar,
        barsHidden
      } = locationContext.mountRoutes(storyboard.routes);

      if (redirect) {
        history.replace(redirect.path, redirect.state);
        return;
      }
      if (barsHidden) {
        this.kernel.toggleBars(false);
      } else {
        if (menuBar.menu && menuBar.menu.defaultCollapsed) {
          this.kernel.menuBar.collapse(true);
          this.defaultCollapsed = true;
        } else {
          if (this.defaultCollapsed) {
            this.kernel.menuBar.collapse(false);
          }
          this.defaultCollapsed = false;
        }
        mountStaticNode(this.kernel.menuBar.element, menuBar);
        mountStaticNode(this.kernel.appBar.element, appBar);
      }

      if (legacy === "iframe") {
        this.kernel.toggleLegacyIframe(true);
      }

      mountTree(bg, mountPoints.bg as MountableElement);
      if (main.length > 0) {
        // Life cycle: useResolves:
        try {
          await this.resolver.resolve(all, mountPoints.bg as MountableElement);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error);

          // Redirect to login page if not logged in.
          if (isUnauthenticatedError(error)) {
            const history = getHistory();
            history.push("/auth/login", {
              from: location
            });
            return;
          }

          main = [
            {
              type: "basic-bricks.page-error",
              properties: {
                error: httpErrorToString(error)
              },
              events: {}
            }
          ];
        }

        mountTree(main, mountPoints.main as MountableElement);

        // Life cycle: didMount:
        all
          .filter(brick => brick.lifeCycle && brick.lifeCycle.didMount)
          .forEach(brick => {
            setTimeout(() => {
              (brick.element as any)[brick.lifeCycle.didMount]();
            });
          });

        this.resolver.scheduleRefreshing();
        return;
      }
    }

    mountTree([], mountPoints.bg as MountableElement);
    mountTree(
      [
        {
          type: "basic-bricks.page-not-found",
          properties: {
            url: history.createHref(location)
          },
          events: {}
        }
      ],
      mountPoints.main as MountableElement
    );
  };
}
