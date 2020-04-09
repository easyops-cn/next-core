import { locationsAreEqual, createPath, Action } from "history";
import { PluginLocation, PluginRuntimeContext } from "@easyops/brick-types";
import { restoreDynamicTemplates } from "@easyops/brick-utils";
import {
  LocationContext,
  mountTree,
  mountStaticNode,
  Kernel,
  MountableElement,
  unmountTree,
  MountRoutesResult,
  appendBrick,
  Resolver,
} from "./exports";
import { getHistory } from "../history";
import { httpErrorToString, handleHttpError } from "../handleHttpError";
import { isUnauthenticatedError } from "../isUnauthenticatedError";
import { RecentApps, RouterState } from "./interfaces";
import { resetAllInjected } from "../injected";
import { getAuth } from "../auth";

export class Router {
  private defaultCollapsed = false;
  private locationContext: LocationContext;
  private rendering = false;
  private nextLocation: PluginLocation;
  private prevLocation: PluginLocation;
  private state: RouterState = "initial";
  private featureFlags: any;

  constructor(private kernel: Kernel) {
    this.featureFlags = this.kernel.getFeatureFlags();
  }

  private locationChangeNotify(from: string, to: string) {
    if (this.featureFlags["log-location-change"]) {
      const username = getAuth().username;
      const params = new URLSearchParams();
      params.append("u", username);
      params.append("f", from);
      params.append("t", to);
      params.append("ts", (+new Date()).toString());
      const image = new Image();
      image.src = `assets/ea/analytics.jpg?${params.toString()}`;
    }
  }

  async bootstrap(): Promise<void> {
    const history = getHistory();
    this.prevLocation = history.location;
    this.locationChangeNotify("", history.location.pathname);
    history.listen(async (location: PluginLocation, action: Action) => {
      let ignoreRendering = false;
      const omittedLocationProps: Partial<PluginLocation> = {
        hash: null,
        state: null,
      };
      // Omit the "key" when checking whether locations are equal in certain situations.
      if (
        // When current location is triggered by browser action of hash link.
        location.key === undefined ||
        // When current location is triggered by browser action of non-push-or-replace,
        // such as goBack or goForward,
        (action === "POP" &&
          // and the previous location was triggered by hash link,
          (this.prevLocation.key === undefined ||
            // or the previous location specified notify false.
            this.prevLocation.state?.notify === false))
      ) {
        omittedLocationProps.key = null;
      }
      if (
        locationsAreEqual(
          { ...this.prevLocation, ...omittedLocationProps },
          { ...location, ...omittedLocationProps }
        ) ||
        (action !== "POP" && location.state?.notify === false)
      ) {
        // Ignore rendering if location not changed except hash, state and optional key.
        // Ignore rendering if notify is `false`.
        ignoreRendering = true;
      }
      if (ignoreRendering) {
        this.prevLocation = location;
        return;
      }

      this.locationChangeNotify(this.prevLocation.pathname, location.pathname);
      this.prevLocation = location;

      if (this.rendering) {
        this.nextLocation = location;
      } else {
        try {
          await this.queuedRender(location);
        } catch (e) {
          handleHttpError(e);
        }
      }
    });
    await this.queuedRender(history.location);
    this.kernel.firstRendered();
  }

  private async queuedRender(location: PluginLocation): Promise<void> {
    this.rendering = true;
    try {
      await this.render(location);
    } finally {
      this.rendering = false;
      if (this.nextLocation) {
        const nextLocation = this.nextLocation;
        this.nextLocation = null;
        await this.queuedRender(nextLocation);
      }
    }
  }

  private async render(location: PluginLocation): Promise<void> {
    resetAllInjected();

    if (this.locationContext) {
      this.locationContext.resolver.resetRefreshQueue();
    }

    const history = getHistory();
    const locationContext = (this.locationContext = new LocationContext(
      this.kernel,
      location
    ));
    const storyboard = locationContext.matchStoryboard(
      this.kernel.bootstrapData.storyboards
    );

    if (storyboard) {
      // 将动态解析后的模板还原，以便重新动态解析。
      restoreDynamicTemplates(storyboard);

      // 如果找到匹配的 storyboard，那么加载它的依赖库。
      await this.kernel.loadDepsOfStoryboard(storyboard);
    }

    const { mountPoints, currentApp: previousApp } = this.kernel;
    const currentApp = storyboard ? storyboard.app : undefined;
    // Storyboard maybe re-assigned, e.g. when open launchpad.
    const appChanged =
      previousApp && currentApp
        ? previousApp.id !== currentApp.id
        : previousApp !== currentApp;
    const legacy = currentApp ? currentApp.legacy : undefined;
    this.kernel.nextApp = currentApp;

    this.state = "initial";
    unmountTree(mountPoints.bg as MountableElement);

    if (storyboard) {
      const mountRoutesResult: MountRoutesResult = {
        main: [],
        menuInBg: [],
        menuBar: {
          app: this.kernel.nextApp,
        },
        appBar: {
          app: this.kernel.nextApp,
          breadcrumb: [],
        },
        flags: {
          redirect: undefined,
          hybrid: false,
          failed: false,
        },
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
            from: location,
          });
          return;
        }

        mountRoutesResult.flags.failed = true;
        mountRoutesResult.main = [
          {
            type: "basic-bricks.page-error",
            properties: {
              error: httpErrorToString(error),
            },
            events: {},
          },
        ];
      }

      const { main, menuInBg, menuBar, appBar, flags } = mountRoutesResult;

      const { redirect, barsHidden, hybrid, failed } = flags;

      if (redirect) {
        history.replace(redirect.path, redirect.state);
        return;
      }

      this.state = "ready-to-mount";

      if (appChanged) {
        this.kernel.currentApp = currentApp;
        this.kernel.previousApp = previousApp;
      }
      this.kernel.currentUrl = createPath(location);
      await this.kernel.updateWorkspaceStack();

      // Unmount main tree to avoid app change fired before new routes mounted.
      unmountTree(mountPoints.main as MountableElement);

      const actualLegacy =
        (legacy === "iframe" && !hybrid) || (legacy !== "iframe" && hybrid)
          ? "iframe"
          : undefined;
      this.kernel.unsetBars({ appChanged, legacy: actualLegacy });

      if (appChanged) {
        window.dispatchEvent(
          new CustomEvent<RecentApps>("app.change", {
            detail: this.kernel.getRecentApps(),
          })
        );
      }

      if (barsHidden) {
        this.kernel.toggleBars(false);
      } else {
        if (menuBar.menu?.defaultCollapsed) {
          this.kernel.menuBar.collapse(true);
          this.defaultCollapsed = true;
        } else {
          if (this.defaultCollapsed) {
            this.kernel.menuBar.collapse(false);
          }
          this.defaultCollapsed = false;
        }
        if (actualLegacy === "iframe") {
          // Do not modify breadcrumb in iframe mode,
          // it will be *popped* from iframe automatically.
          delete appBar.breadcrumb;
        }
        mountStaticNode(this.kernel.menuBar.element, menuBar);
        mountStaticNode(this.kernel.appBar.element, appBar);
      }

      this.kernel.toggleLegacyIframe(actualLegacy === "iframe");

      menuInBg.forEach((brick) => {
        appendBrick(brick, mountPoints.bg as MountableElement);
      });

      if (main.length > 0) {
        mountTree(main, mountPoints.main as MountableElement);
        if (!failed) {
          this.locationContext.handlePageLoad();
          this.locationContext.handleAnchorLoad();
          this.locationContext.resolver.scheduleRefreshing();
        }
        this.state = "mounted";
        return;
      }
    }

    this.state = "ready-to-mount";

    mountTree(
      [
        {
          type: "basic-bricks.page-not-found",
          properties: {
            url: history.createHref(location),
          },
          events: {},
        },
      ],
      mountPoints.main as MountableElement
    );

    this.state = "mounted";
  }

  /* istanbul ignore next */
  getResolver(): Resolver {
    return this.locationContext.resolver;
  }

  getState(): RouterState {
    return this.state;
  }

  /* istanbul ignore next */
  getCurrentContext(): PluginRuntimeContext {
    return this.locationContext.getCurrentContext();
  }
}
