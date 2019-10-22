import { PluginLocation } from "@easyops/brick-types";
import {
  loadScript,
  getTemplateDepsOfStoryboard,
  getDllAndDepsOfStoryboard,
  asyncProcessStoryboard
} from "@easyops/brick-utils";
import {
  LocationContext,
  mountTree,
  mountStaticNode,
  Kernel,
  MountableElement,
  unmountTree,
  MountRoutesResult
} from "./exports";
import { getHistory } from "../history";
import { httpErrorToString } from "../handleHttpError";
import { isUnauthenticatedError } from "../isUnauthenticatedError";
import { brickTemplateRegistry } from "./TemplateRegistries";

export class Router {
  private defaultCollapsed = false;
  private locationContext: LocationContext;

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
    if (this.locationContext) {
      this.locationContext.resolver.resetRefreshQueue();
    }

    const history = getHistory();
    const locationContext = (this.locationContext = new LocationContext(
      this.kernel,
      location
    ));
    const { bootstrapData } = this.kernel;
    const storyboard = locationContext.matchStoryboard(
      bootstrapData.storyboards
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
          bootstrapData.brickPackages
            .map(item => item.filePath)
            .concat(bootstrapData.templatePackages.map(item => item.filePath))
        );
      } else if (!storyboard.depsProcessed) {
        // 先加载模板
        const templateDeps = getTemplateDepsOfStoryboard(
          storyboard,
          bootstrapData.templatePackages
        );
        await loadScript(templateDeps);
        // 加载模板后才能加工得到最终的构件表
        const result = getDllAndDepsOfStoryboard(
          await asyncProcessStoryboard(
            storyboard,
            brickTemplateRegistry,
            bootstrapData.templatePackages
          ),
          bootstrapData.brickPackages
        );
        await loadScript(result.dll);
        await loadScript(result.deps);
        // 每个 storyboard 仅处理一次依赖
        storyboard.depsProcessed = true;
      }
    }

    const { mountPoints, currentApp: previousApp } = this.kernel;
    const currentApp = storyboard ? storyboard.app : undefined;
    const appChanged = previousApp !== currentApp;
    const legacy = currentApp ? currentApp.legacy : undefined;

    unmountTree(mountPoints.bg as MountableElement);
    unmountTree(mountPoints.main as MountableElement);

    this.kernel.unsetBars({ appChanged, legacy });
    this.kernel.toggleLegacyIframe(false);

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
      const mountRoutesResult: MountRoutesResult = {
        main: [],
        menuBar: {
          app: this.kernel.currentApp
        },
        appBar: {
          app: this.kernel.currentApp,
          breadcrumb: this.kernel.appBar.element.breadcrumb
        },
        redirect: undefined,
        hybrid: false
      };
      try {
        await locationContext.mountRoutes(
          storyboard.routes,
          undefined,
          mountRoutesResult
        );
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

        mountRoutesResult.main = [
          {
            type: "basic-bricks.page-error",
            properties: {
              error: httpErrorToString(error)
            },
            events: {}
          }
        ];
      }

      const {
        redirect,
        main,
        menuBar,
        appBar,
        barsHidden,
        hybrid
      } = mountRoutesResult;

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
      if (legacy === "iframe" && !hybrid) {
        this.kernel.toggleLegacyIframe(true);
      } else if (legacy !== "iframe" && hybrid) {
        this.kernel.toggleLegacyIframe(true);
      }

      if (main.length > 0) {
        mountTree(main, mountPoints.main as MountableElement);
        this.locationContext.resolver.scheduleRefreshing();
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
