import { locationsAreEqual, Action, Location } from "history";
import { uniqueId } from "lodash";
import type {
  LayoutType,
  PluginHistoryState,
  PluginLocation,
  PluginRuntimeContext,
  RuntimeMisc,
  NavTip,
  BrickConf,
  MatchResult,
} from "@next-core/brick-types";
import {
  restoreDynamicTemplates,
  scanStoryboard,
  mapCustomApisToNameAndNamespace,
  CustomApiInfo,
  removeDeadConditions,
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
  NavConfig,
} from "./exports";
import { getHistory } from "../history";
import {
  httpErrorToString,
  handleHttpError,
  getRefinedErrorConf,
} from "../handleHttpError";
import { isUnauthenticatedError } from "../internal/isUnauthenticatedError";
import { RecentApps, RouterState } from "./interfaces";
import { resetAllInjected } from "../internal/injected";
import { getAuth, isLoggedIn } from "../auth";
import { devtoolsHookEmit } from "../internal/devtools";
import { afterMountTree } from "./reconciler";
import { constructMenu } from "../internal/menu";
import { getRuntimeMisc } from "../internal/misc";
import {
  applyMode,
  applyTheme,
  setMode,
  setTheme,
  getLocalAppsTheme,
} from "../themeAndMode";
import { preCheckPermissions } from "../internal/checkPermissions";
import { clearPollTimeout } from "../internal/poll";
import { shouldBeDefaultCollapsed } from "../internal/shouldBeDefaultCollapsed";
import { registerStoryboardFunctions } from "./StoryboardFunctions";
import { registerMock } from "./MockRegistry";
import { registerFormRenderer } from "./CustomForms/registerFormRenderer";
import {
  clearCollectWidgetContract,
  collectContract,
} from "./CollectContracts";
import { StoryboardContextWrapper } from "./StoryboardContext";
import { Media, mediaEventTarget } from "../internal/mediaQuery";
import {
  getStandaloneInstalledApps,
  preFetchStandaloneInstalledApps,
} from "../internal/getStandaloneInstalledApps";
import { mergePreviewRoutes } from "../internal/mergePreviewRoutes";
import { imagesFactory } from "../internal/images";
import { computeRealValue } from "../internal/setProperties";
import { abortController } from "../abortController";
import { isHttpAbortError } from "../internal/isHttpAbortError";
import { isOutsideApp, matchStoryboard } from "./matchStoryboard";
import { setLoginStateCookie } from "../setLoginStateCookie";
import { httpCacheRecord } from "./HttpCache";
import i18next from "i18next";
import { K, NS_BRICK_KIT } from "../i18n/constants";
import { getRuntime } from "../runtime";
import { setUIVersion } from "./setUIVersion";

export class Router {
  private defaultCollapsed = false;
  private locationContext: LocationContext;
  private rendering = false;
  private nextLocation: PluginLocation;
  private prevLocation: PluginLocation;
  private state: RouterState = "initial";
  private renderId: string;
  private navConfig: NavConfig;
  private mediaEventTargetHandler: (event: CustomEvent<Media>) => void;

  constructor(private kernel: Kernel) {
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
    if (this.kernel.getFeatureFlags()["log-location-change"]) {
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
      abortController.abortPendingRequest();
      this.locationChangeNotify(this.prevLocation.pathname, location.pathname);
      this.prevLocation = location;
      this.locationContext.handlePageLeave();
      this.locationContext.messageDispatcher.reset();

      if (action === "POP") {
        const storyboard = matchStoryboard(
          this.kernel.bootstrapData.storyboards,
          location.pathname
        );
        // When a browser action of goBack or goForward is performing,
        // force reload when the target page is a page of an outside app.
        if (isOutsideApp(storyboard)) {
          window.location.reload();
        }
      }

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
    const renderId = (this.renderId = uniqueId("render-id-"));

    resetAllInjected();
    clearPollTimeout();
    clearCollectWidgetContract();

    if (this.locationContext) {
      this.locationContext.resolver.resetRefreshQueue();
    }

    const history = getHistory();
    history.unblock();

    const renderStartTime = performance.now();
    httpCacheRecord.start();
    // Create the page tracker before page load.
    // And the API Analyzer maybe disabled.
    const tracePageEnd = apiAnalyzer.getInstance()?.tracePage();

    const locationContext = (this.locationContext = new LocationContext(
      this.kernel,
      location,
      renderId
    ));

    if ((window as any).DEVELOPER_PREVIEW) {
      return;
    }

    const storyboard = locationContext.matchStoryboard(
      this.kernel.bootstrapData.storyboards
    );

    /** Pending task for loading bricks */
    let pendingTask: Promise<void>;
    if (storyboard) {
      await this.kernel.fulfilStoryboard(storyboard);

      this.kernel.nextApp = storyboard.app;

      removeDeadConditions(storyboard, {
        constantFeatureFlags: true,
        featureFlags: this.kernel.getFeatureFlags(),
      });

      // 将动态解析后的模板还原，以便重新动态解析。
      restoreDynamicTemplates(storyboard);

      const parallelRequests: Promise<unknown>[] = [];

      // 预加载权限信息
      if (isLoggedIn() && !getAuth().isAdmin) {
        parallelRequests.push(preCheckPermissions(storyboard));
      }

      // Standalone App 需要额外读取 Installed App 信息
      if (window.STANDALONE_MICRO_APPS && !window.NO_AUTH_GUARD) {
        // TODO: get standalone apps when NO_AUTH_GUARD, maybe from conf.yaml
        parallelRequests.push(
          preFetchStandaloneInstalledApps(storyboard).then(() => {
            this.kernel.bootstrapData.offSiteStandaloneApps =
              getStandaloneInstalledApps();
          })
        );
      }

      // `loadDepsOfStoryboard()` may requires these data.
      await Promise.all(parallelRequests);

      // 如果找到匹配的 storyboard，那么根据路由匹配得到的 sub-storyboard 加载它的依赖库。
      const subStoryboard = await this.locationContext.getSubStoryboardByRoute(
        storyboard
      );
      ({ pendingTask } = await this.kernel.loadDepsOfStoryboard(subStoryboard));

      // 注册 Storyboard 中定义的自定义模板和函数。
      this.kernel.registerCustomTemplatesInStoryboard(storyboard);
      registerStoryboardFunctions(storyboard.meta?.functions, storyboard.app);

      registerMock(storyboard.meta?.mocks);

      registerFormRenderer();

      collectContract(storyboard.meta?.contracts);
    }

    const { mountPoints, currentApp: previousApp } = this.kernel;
    const currentApp = storyboard ? storyboard.app : undefined;
    // Storyboard maybe re-assigned, e.g. when open launchpad.
    const appChanged =
      previousApp && currentApp
        ? previousApp.id !== currentApp.id
        : previousApp !== currentApp;
    const legacy = currentApp ? currentApp.legacy : undefined;
    let layoutType: LayoutType = currentApp?.layoutType || "console";

    const faviconElement: HTMLLinkElement = document.querySelector(
      "link[rel='shortcut icon']"
    );
    const customFaviconHref = (
      currentApp?.config?._easyops_app_favicon as Record<string, string>
    )?.default;
    const settingsFaviconHref =
      this.kernel.bootstrapData.settings?.brand?.favicon;
    if (faviconElement) {
      if (customFaviconHref) {
        faviconElement.href = /^(?:https?|data):|^\//.test(customFaviconHref)
          ? customFaviconHref
          : imagesFactory(currentApp.id, currentApp.isBuildPush).get(
              customFaviconHref
            );
      } else if (settingsFaviconHref) {
        faviconElement.href = settingsFaviconHref;
      } else {
        faviconElement.href = this.kernel.getOriginFaviconHref();
      }
      this.kernel.setOriginFaviconHref(faviconElement.href);
    }

    const illustrationStyle = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: "translateY(-100px)",
      height: "calc(100vh - var(--app-bar-height))",
    };

    setTheme(
      getLocalAppsTheme()?.[currentApp?.id] || currentApp?.theme || "light"
    );

    getRuntime().getFeatureFlags()["support-ui-8.2-compact-layout"]
      ? document.body.classList.add("compact-layout")
      : document.body.classList.remove("compact-layout");
    setMode("default");

    devtoolsHookEmit("rendering");

    unmountTree(mountPoints.bg as MountableElement);

    const redirectToLogin = (): void => {
      setLoginStateCookie(location);
      history.replace(
        this.kernel.getFeatureFlags()["sso-enabled"]
          ? "/sso-auth/login"
          : "/auth/login",
        {
          from: location,
        }
      );
    };

    if (storyboard) {
      const { bricks, customApis } = scanStoryboard(storyboard);
      if (appChanged && currentApp.id && isLoggedIn()) {
        const usedCustomApis: CustomApiInfo[] =
          mapCustomApisToNameAndNamespace(customApis);
        if (usedCustomApis?.length) {
          await this.kernel.loadMicroAppApiOrchestrationAsync(usedCustomApis);
        }
      }
      layoutType =
        bricks.some((brick) =>
          [
            "base-layout.tpl-base-page-module",
            "base-layout.tpl-homepage-base-module",
            "base-layout.tpl-homepage-base-module-cmdb",
            "base-layout.tpl-base-page-module-cmdb",
          ].includes(brick)
        ) &&
        layoutType === "business" &&
        !this.kernel.getFeatureFlags()["support-ui-8.0-base-layout"]
          ? "console"
          : layoutType;

      const mountRoutesResult: MountRoutesResult = {
        main: [],
        menuInBg: [],
        menuBar: {},
        portal: [],
        appBar: {
          breadcrumb: [],
          documentId: null,
          noCurrentApp:
            typeof currentApp.breadcrumb?.noCurrentApp === "string"
              ? (computeRealValue(
                  currentApp.breadcrumb?.noCurrentApp,
                  this.locationContext.getCurrentContext()
                ) as boolean)
              : currentApp.breadcrumb?.noCurrentApp ?? false,
        },
        flags: {
          redirect: undefined,
          hybrid: false,
          failed: false,
        },
      };
      try {
        const mergedRoutes = mergePreviewRoutes(storyboard.routes);
        await locationContext.mountRoutes(
          mergedRoutes,
          undefined,
          mountRoutesResult
        );
        await locationContext.storyboardContextWrapper.waitForAllContext();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);

        // Redirect to login page if not logged in.
        if (isUnauthenticatedError(error) && !window.NO_AUTH_GUARD) {
          mountRoutesResult.flags.unauthenticated = true;
        } else if (isHttpAbortError(error)) {
          return;
        } else {
          const noAuthGuardLoginPath =
            getRuntime().getMiscSettings().noAuthGuardLoginPath;
          if (isUnauthenticatedError(error) && noAuthGuardLoginPath) {
            history.replace(noAuthGuardLoginPath);
            return;
          }
          await this.kernel.layoutBootstrap(layoutType);
          const brickPageError = this.kernel.presetBricks.pageError;
          await this.kernel.loadDynamicBricks([brickPageError]);

          mountRoutesResult.flags.failed = true;
          const { title, illustration, showBackLink } =
            getRefinedErrorConf(error);
          mountRoutesResult.main = [
            {
              type: brickPageError,
              properties: {
                status: "illustrations",
                useNewIllustration: true,
                customTitle: title,
                subTitle: httpErrorToString(error),
                illustrationsConfig: illustration,
                style: illustrationStyle,
              },
              ...(showBackLink
                ? {
                    children: [
                      {
                        type: "a",
                        properties: {
                          textContent: i18next.t(
                            `${NS_BRICK_KIT}:${K.GO_BACK_PREVIOUS_PAGE}`
                          ),
                          style: {
                            display: "block",
                            textAlign: "center",
                          },
                        },
                        slotId: "content",
                        events: {
                          click: [
                            {
                              action: "history.goBack",
                            },
                          ],
                        },
                      },
                    ],
                  }
                : {}),
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
      this.kernel.currentRoute = route;
      await this.kernel.layoutBootstrap(layoutType);

      this.state = "ready-to-mount";

      // Unmount main tree to avoid app change fired before new routes mounted.
      unmountTree(mountPoints.main as MountableElement);
      unmountTree(mountPoints.portal as MountableElement);

      const actualLegacy =
        (legacy === "iframe" && !hybrid) || (legacy !== "iframe" && hybrid)
          ? "iframe"
          : undefined;
      this.kernel.unsetBars({ appChanged, legacy: actualLegacy });

      if (this.mediaEventTargetHandler) {
        mediaEventTarget.removeEventListener(
          "change",
          this.mediaEventTargetHandler as EventListener
        );
        this.mediaEventTargetHandler = undefined;
      }

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

      let misc: RuntimeMisc;
      if (
        barsHidden ||
        ((misc = getRuntimeMisc()),
        misc.isInIframeOfSameSite && !misc.isInIframeOfVisualBuilder)
      ) {
        this.kernel.toggleBars(false);
      } else {
        await constructMenu(
          menuBar,
          this.locationContext.getCurrentContext(),
          this.kernel
        );
        if (this.kernel.currentLayout === "console") {
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
      }

      this.setNavConfig(mountRoutesResult);

      this.kernel.toggleLegacyIframe(actualLegacy === "iframe");

      await Promise.all(
        menuInBg.map(async (brick) => {
          await this.kernel.loadDynamicBricks([brick.type]);
          appendBrick(brick, mountPoints.portal as MountableElement);
        })
      );

      // When we have a matched route other than an abstract route,
      // we say *page found*, otherwise, *page not found*.
      if ((route && route.type !== "routes") || failed) {
        await pendingTask;
        window.DISABLE_REACT_FLUSH_SYNC = false;

        setUIVersion(currentApp?.uiVersion);
        main.length > 0 &&
          mountTree(main, mountPoints.main as MountableElement);
        portal.length > 0 &&
          mountTree(portal, mountPoints.portal as MountableElement);

        afterMountTree(mountPoints.main as MountableElement);
        afterMountTree(mountPoints.portal as MountableElement);
        afterMountTree(mountPoints.bg as MountableElement);

        setTimeout(() => {
          window.DISABLE_REACT_FLUSH_SYNC = true;
        });

        // Scroll to top after each rendering.
        // See https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/docs/guides/scroll-restoration.md
        window.scrollTo(0, 0);

        if (!failed) {
          locationContext.storyboardContextWrapper.handleAsyncAfterMount();

          this.locationContext.handleBrickBindObserver();
          this.locationContext.handlePageLoad();
          this.locationContext.handleAnchorLoad();
          this.locationContext.resolver.scheduleRefreshing();
          this.locationContext.handleMessage();
        }

        this.mediaEventTargetHandler = (event) =>
          this.locationContext.handleMediaChange(event.detail);
        mediaEventTarget.addEventListener(
          "change",
          this.mediaEventTargetHandler as EventListener
        );

        tracePageEnd?.({
          path: locationContext.getCurrentMatch().path,
          username: getAuth().username,
          pageTitle: document.title,
        });
        httpCacheRecord.end();

        // show app bar tips
        const tipsDetail: NavTip[] = [];
        const getUnionKey = (key: string) => {
          const { org } = getAuth();
          return `${key}:${org}`;
        };

        const renderTime = Math.round(performance.now() - renderStartTime);
        // For bricks which would take actions with render time.
        window.dispatchEvent(
          new CustomEvent("route.render", {
            detail: {
              renderTime,
            },
          })
        );

        const { loadTime = 0, loadInfoPage } =
          this.kernel.bootstrapData.settings?.misc ?? {};
        if (currentApp.isBuildPush && loadTime > 0 && renderTime > loadTime) {
          const getSecond = (time: number): number =>
            Math.floor(time * 100) / 100;
          tipsDetail.push({
            text: `您的页面存在性能问题, 当前页面渲染时间 ${getSecond(
              renderTime / 1000
            )} 秒, 规定阈值为: ${getSecond(
              (loadTime as number) / 1000
            )} 秒, 您已超过。请您针对该页面进行性能优化!`,
            closable: false,
            isCenter: true,
            tipKey: getUnionKey("render"),
            backgroundColor: "var(--color-warning-bg)",
            ...(loadInfoPage
              ? {
                  info: {
                    label: "建议解决思路",
                    url: loadInfoPage as string,
                  },
                }
              : {}),
          });
        }

        const validDaysLeft: number = getAuth().license?.validDaysLeft;
        if (validDaysLeft && validDaysLeft <= 15 && getAuth().isAdmin) {
          tipsDetail.push({
            text: `离License过期还有 ${validDaysLeft} 天`,
            tipKey: getUnionKey("license"),
            closable: true,
            isCenter: true,
            backgroundColor: "var(--color-info-bg)",
          });
        }

        if (tipsDetail.length !== 0) {
          window.dispatchEvent(
            new CustomEvent<NavTip[]>("app.bar.tips", { detail: tipsDetail })
          );
        }

        // analytics page_view event
        userAnalytics.event("page_view", {
          micro_app_id: this.kernel.currentApp.id,
          route_alias: route?.alias,
          ...analyticsData,
        });

        this.state = "mounted";

        devtoolsHookEmit("rendered");

        if (this.kernel.getFeatureFlags()["prefetch-scripts"]) {
          // Try to prefetch during a browser's idle periods.
          // https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
          if (typeof window.requestIdleCallback === "function") {
            window.requestIdleCallback(() => {
              this.kernel.prefetchDepsOfStoryboard(storyboard);
            });
          } else {
            setTimeout(() => {
              this.kernel.prefetchDepsOfStoryboard(storyboard);
            }, 0);
          }
        }
        return;
      }
    } else if (!window.NO_AUTH_GUARD && !isLoggedIn()) {
      // Todo(steve): refine after api-gateway supports fetching storyboards before logged in.
      // Redirect to login if no storyboard is matched.
      redirectToLogin();
      return;
    }

    await this.kernel.layoutBootstrap(storyboard ? layoutType : "business");
    const brickPageNotFound = this.kernel.presetBricks.pageNotFound;
    await this.kernel.loadDynamicBricks([brickPageNotFound]);

    const notFoundAppConfig = {
      illustrationsConfig: {
        name: "no-permission",
        category: "easyops2",
      },
      customTitle: i18next.t(`${NS_BRICK_KIT}:${K.APP_NOT_FOUND}`),
    };

    const notFoundPageConfig = {
      illustrationsConfig: {
        name: "http-404",
        category: "exception",
      },
      customTitle: i18next.t(`${NS_BRICK_KIT}:${K.PAGE_NOT_FOUND}`),
    };

    this.state = "ready-to-mount";

    mountTree(
      [
        {
          type: brickPageNotFound,
          properties: {
            status: "illustrations",
            useNewIllustration: true,
            style: illustrationStyle,
            ...(storyboard ? notFoundPageConfig : notFoundAppConfig),
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

  private setNavConfig(mountResult: MountRoutesResult): void {
    this.navConfig = {
      breadcrumb: mountResult.appBar.breadcrumb,
      menu: mountResult.menuBar.menu,
      subMenu: mountResult.menuBar.subMenu,
    };
  }

  /* istanbul ignore next */
  getNavConfig(): NavConfig {
    return this.navConfig;
  }

  /* istanbul ignore next */
  getResolver(): Resolver {
    return this.locationContext.resolver;
  }

  getMountBrick(
    ...args: [BrickConf, MatchResult, string, MountRoutesResult]
  ): Promise<void> {
    return this.locationContext.mountBrick(...args);
  }

  getHandlePageLoad(): void {
    return this.locationContext.handlePageLoad();
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
  getStoryboardContextWrapper(): StoryboardContextWrapper {
    return this.locationContext.storyboardContextWrapper;
  }

  /* istanbul ignore next */
  handleMessageClose(event: CloseEvent): void {
    return this.locationContext.handleMessageClose(event);
  }

  waitForUsedContext(data: unknown): Promise<void> {
    return this.locationContext.storyboardContextWrapper.waitForUsedContext(
      data
    );
  }
}
