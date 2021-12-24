import { locationsAreEqual, createPath, Action, Location } from "history";
import { uniqueId } from "lodash";
import {
  LayoutType,
  PluginHistoryState,
  PluginLocation,
  PluginRuntimeContext,
} from "@next-core/brick-types";
import {
  restoreDynamicTemplates,
  scanCustomApisInStoryboard,
  mapCustomApisToNameAndNamespace,
  CustomApiInfo,
} from "@next-core/brick-utils";
import { apiAnalyzer, userAnalytics } from "@next-core/easyops-analytics";
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
import { isUnauthenticatedError } from "../internal/isUnauthenticatedError";
import { RecentApps, RouterState } from "./interfaces";
import { resetAllInjected } from "../internal/injected";
import { getAuth, isLoggedIn } from "../auth";
import { devtoolsHookEmit } from "../internal/devtools";
import { afterMountTree } from "./reconciler";
import { constructMenu } from "../internal/menu";
import { getRuntimeMisc } from "../internal/misc";
import { applyMode, applyTheme, setMode, setTheme } from "../themeAndMode";
import { preCheckPermissions } from "../internal/checkPermissions";
import { clearPollTimeout } from "../internal/poll";
import { shouldBeDefaultCollapsed } from "../internal/shouldBeDefaultCollapsed";
import { CustomTemplateContext } from "./CustomTemplates";
import { registerStoryboardFunctions } from "./StoryboardFunctions";
import { HttpResponseError } from "@next-core/brick-http";
import { registerMock } from "./MockRegistry";

export class Router {
  private defaultCollapsed = false;
  private locationContext: LocationContext;
  private rendering = false;
  private nextLocation: PluginLocation;
  private prevLocation: PluginLocation;
  private state: RouterState = "initial";
  private renderId: string;
  private readonly featureFlags: Record<string, boolean>;

  constructor(private kernel: Kernel) {
    this.featureFlags = this.kernel.getFeatureFlags();

    const history = getHistory();
    window.addEventListener("beforeunload", (event) => {
      const message = this.getBlockMessageBeforePageLave({});
      // See examples in https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
      if (message) {
        // Cancel the event
        // If you prevent default behavior in Mozilla Firefox prompt will always be shown
        event.preventDefault();
        // Chrome requires returnValue to be set
        event.returnValue = "";
      } else {
        // the absence of a returnValue property on the event will guarantee the browser unload happens
        delete event.returnValue;
      }
    });

    history.block((location, action) =>
      this.getBlockMessageBeforePageLave({ location, action })
    );
  }

  private getBlockMessageBeforePageLave(detail: {
    location?: Location<PluginHistoryState>;
    action?: Action;
  }): string {
    const history = getHistory();
    const previousMessage = history.getBlockMessage();
    this.locationContext?.handleBeforePageLeave(detail);
    const message = history.getBlockMessage();
    if (!previousMessage && message) {
      // Auto unblock only if new block was introduced by `onBeforePageLeave`.
      history.unblock();
    }
    return message;
  }

  private locationChangeNotify(from: string, to: string): void {
    if (this.featureFlags["log-location-change"]) {
      const username = getAuth().username;
      const params = new URLSearchParams();
      params.append("u", username);
      params.append("f", from);
      params.append("t", to);
      params.append("ts", (+new Date()).toString());
      const image = new Image();
      image.src = `${
        window.CORE_ROOT ?? ""
      }assets/ea/analytics.jpg?${params.toString()}`;
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
      this.locationContext.handlePageLeave();
      this.locationContext.messageDispatcher.reset();
      if (this.rendering) {
        this.nextLocation = location;
      } else {
        try {
          devtoolsHookEmit("locationChange");
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
    this.state = "initial";
    this.renderId = uniqueId("render-id-");

    resetAllInjected();
    clearPollTimeout();

    if (this.locationContext) {
      this.locationContext.resolver.resetRefreshQueue();
    }

    const history = getHistory();
    history.unblock();

    // Create the page tracker before page load.
    // And the API Analyzer maybe disabled.
    const pageTracker = apiAnalyzer.getInstance()?.pageTracker();

    const locationContext = (this.locationContext = new LocationContext(
      this.kernel,
      location
    ));

    const storyboard = locationContext.matchStoryboard(
      this.kernel.bootstrapData.storyboards
    );

    if (storyboard) {
      await this.kernel.fulfilStoryboard(storyboard);

      // 将动态解析后的模板还原，以便重新动态解析。
      restoreDynamicTemplates(storyboard);

      // 预加载权限信息
      if (isLoggedIn() && !getAuth().isAdmin) {
        await preCheckPermissions(storyboard);
      }

      // 如果找到匹配的 storyboard，那么根据路由匹配得到的 sub-storyboard 加载它的依赖库。
      const subStoryboard =
        this.locationContext.getSubStoryboardByRoute(storyboard);
      await this.kernel.loadDepsOfStoryboard(subStoryboard);

      // 注册 Storyboard 中定义的自定义模板和函数。
      this.kernel.registerCustomTemplatesInStoryboard(storyboard);
      registerStoryboardFunctions(storyboard.meta?.functions, storyboard.app);

      registerMock(storyboard.meta?.mocks);
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
    const layoutType: LayoutType = currentApp?.layoutType || "console";

    devtoolsHookEmit("rendering");

    unmountTree(mountPoints.bg as MountableElement);

    const redirectToLogin = (): void => {
      history.replace(
        this.featureFlags["sso-enabled"] ? "/sso-auth/login" : "/auth/login",
        {
          from: location,
        }
      );
    };

    if (storyboard) {
      if (appChanged && currentApp.id && isLoggedIn()) {
        const usedCustomApis: CustomApiInfo[] = mapCustomApisToNameAndNamespace(
          scanCustomApisInStoryboard(storyboard)
        );
        if (usedCustomApis?.length) {
          await this.kernel.loadMicroAppApiOrchestrationAsync(usedCustomApis);
        }
      }

      const mountRoutesResult: MountRoutesResult = {
        main: [],
        menuInBg: [],
        menuBar: {},
        portal: [],
        appBar: {
          breadcrumb: [],
          documentId: null,
          noCurrentApp: currentApp.breadcrumb?.noCurrentApp ?? false,
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
          mountRoutesResult.flags.unauthenticated = true;
        } else {
          await this.kernel.layoutBootstrap(layoutType);
          const brickPageError = this.kernel.presetBricks.pageError;
          await this.kernel.loadDynamicBricks([brickPageError]);

          mountRoutesResult.flags.failed = true;
          mountRoutesResult.main = [
            {
              type: brickPageError,
              properties: {
                error: httpErrorToString(error),
                code:
                  error instanceof HttpResponseError
                    ? error.response.status
                    : null,
              },
              events: {},
            },
          ];
          mountRoutesResult.portal = [];
        }
      }

      const {
        main,
        menuInBg,
        menuBar,
        appBar,
        flags,
        portal,
        route,
        analyticsData,
      } = mountRoutesResult;

      const { unauthenticated, redirect, barsHidden, hybrid, failed } = flags;

      if (unauthenticated) {
        redirectToLogin();
        return;
      }

      if (redirect) {
        history.replace(redirect.path, redirect.state);
        return;
      }

      if (appChanged) {
        this.kernel.currentApp = currentApp;
        this.kernel.previousApp = previousApp;
      }
      this.kernel.currentUrl = createPath(location);
      this.kernel.currentRoute = route;
      await Promise.all([
        ...(window.STANDALONE_MICRO_APPS
          ? []
          : [this.kernel.updateWorkspaceStack()]),
        this.kernel.layoutBootstrap(layoutType),
      ]);

      this.state = "ready-to-mount";

      // Unmount main tree to avoid app change fired before new routes mounted.
      unmountTree(mountPoints.main as MountableElement);
      unmountTree(mountPoints.portal as MountableElement);

      const actualLegacy =
        (legacy === "iframe" && !hybrid) || (legacy !== "iframe" && hybrid)
          ? "iframe"
          : undefined;
      this.kernel.unsetBars({ appChanged, legacy: actualLegacy });

      setTheme("light");
      setMode("default");
      // There is a window to set theme and mode by `lifeCycle.onBeforePageLoad`.
      this.locationContext.handleBeforePageLoad();
      applyTheme();
      applyMode();

      if (appChanged) {
        window.dispatchEvent(
          new CustomEvent<RecentApps>("app.change", {
            detail: this.kernel.getRecentApps(),
          })
        );
      }

      if (barsHidden || getRuntimeMisc().isInIframeOfLegacyConsole) {
        this.kernel.toggleBars(false);
      } else if (this.kernel.currentLayout === "console") {
        await constructMenu(
          menuBar,
          this.locationContext.getCurrentContext(),
          this.kernel
        );
        if (
          shouldBeDefaultCollapsed(
            menuBar.menu?.defaultCollapsed,
            menuBar.menu?.defaultCollapsedBreakpoint
          )
        ) {
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
        appendBrick(brick, mountPoints.portal as MountableElement);
      });

      if (main.length > 0 || portal.length > 0) {
        main.length > 0 &&
          mountTree(main, mountPoints.main as MountableElement);
        portal.length > 0 &&
          mountTree(portal, mountPoints.portal as MountableElement);

        afterMountTree(mountPoints.main as MountableElement);
        afterMountTree(mountPoints.portal as MountableElement);
        afterMountTree(mountPoints.bg as MountableElement);

        if (!failed) {
          this.locationContext.handlePageLoad();
          this.locationContext.handleAnchorLoad();
          this.locationContext.resolver.scheduleRefreshing();
          this.locationContext.handleMessage();
        }

        // Scroll to top after each rendering.
        // See https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/docs/guides/scroll-restoration.md
        window.scrollTo(0, 0);

        pageTracker?.(locationContext.getCurrentMatch().path);

        // analytics page_view event
        userAnalytics.event("page_view", {
          micro_app_id: this.kernel.currentApp.id,
          route_alias: route?.alias,
          ...analyticsData,
        });

        this.state = "mounted";

        devtoolsHookEmit("rendered");

        // Try to prefetch during a browser's idle periods.
        // https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
        if (typeof (window as any).requestIdleCallback === "function") {
          (window as any).requestIdleCallback(() => {
            this.kernel.prefetchDepsOfStoryboard(storyboard);
          });
        } else {
          Promise.resolve().then(() => {
            this.kernel.prefetchDepsOfStoryboard(storyboard);
          });
        }
        return;
      }
    } else if (!window.NO_AUTH_GUARD && !isLoggedIn()) {
      // Todo(steve): refine after api-gateway supports fetching storyboards before logged in.
      // Redirect to login if no storyboard is matched.
      redirectToLogin();
      return;
    }

    await this.kernel.layoutBootstrap(layoutType);
    const brickPageNotFound = this.kernel.presetBricks.pageNotFound;
    await this.kernel.loadDynamicBricks([brickPageNotFound]);

    this.state = "ready-to-mount";

    mountTree(
      [
        {
          type: brickPageNotFound,
          properties: {
            url: history.createHref(location),
          },
          events: {},
        },
      ],
      mountPoints.main as MountableElement
    );
    unmountTree(mountPoints.portal as MountableElement);

    // Scroll to top after each rendering.
    window.scrollTo(0, 0);

    this.state = "mounted";
    devtoolsHookEmit("rendered");
  }

  /* istanbul ignore next */
  getResolver(): Resolver {
    return this.locationContext.resolver;
  }

  getState(): RouterState {
    return this.state;
  }

  /* istanbul ignore next */
  getRenderId(): string {
    return this.renderId;
  }

  /* istanbul ignore next */
  getCurrentContext(): PluginRuntimeContext {
    return this.locationContext.getCurrentContext();
  }

  /* istanbul ignore next */
  getTplContext(): CustomTemplateContext {
    return this.locationContext.getTplContext();
  }

  /* istanbul ignore next */
  handleMessageClose(event: CloseEvent): void {
    return this.locationContext.handleMessageClose(event);
  }
}
