import { Action, locationsAreEqual } from "history";
import type {
  BreadcrumbItemConf,
  MicroApp,
  StaticMenuConf,
  Storyboard,
} from "@next-core/types";
import { HttpAbortError } from "@next-core/http";
import {
  clearExpressionASTCache,
  clearFunctionASTCache,
} from "@next-core/cook";
import { uniqueId } from "lodash";
import { NextHistoryState, NextLocation, getHistory } from "../history.js";
import {
  RenderOutput,
  getDataStores,
  postAsyncRender,
  renderRoutes,
} from "./Renderer.js";
import { DataStore } from "./data/DataStore.js";
import { clearResolveCache } from "./data/resolveData.js";
import { mountTree, unmountTree } from "./mount.js";
import { isOutsideApp, matchStoryboard } from "./matchStoryboard.js";
import { registerStoryboardFunctions } from "./compute/StoryboardFunctions.js";
import { RendererContext, RouteHelper } from "./RendererContext.js";
import {
  applyMode,
  applyTheme,
  getLocalAppsTheme,
  setMode,
  setTheme,
  setThemeVariant,
} from "../themeAndMode.js";
import {
  _internalApiGetAppInBootstrapData,
  getRuntime,
  hooks,
} from "./Runtime.js";
import { getPageInfo } from "../getPageInfo.js";
import type {
  Dispose,
  MenuRequestNode,
  RenderRoot,
  RuntimeContext,
} from "./interfaces.js";
import { resetAllComputedMarks } from "./compute/markAsComputed.js";
import { handleHttpError, isUnauthenticatedError } from "../handleHttpError.js";
import { abortPendingRequest, initAbortController } from "./abortController.js";
import { setLoginStateCookie } from "../setLoginStateCookie.js";
import { registerCustomTemplates } from "./registerCustomTemplates.js";
import { fulfilStoryboard } from "./fulfilStoryboard.js";
import { RenderTag } from "./enums.js";
import { insertPreviewRoutes } from "./insertPreviewRoutes.js";
import { devtoolsHookEmit } from "./devtools.js";
import { setUIVersion } from "../setUIVersion.js";
import { setAppVariable } from "../setAppVariable.js";
import { setWatermark } from "../setWatermark.js";
import { clearMatchedRoutes } from "./routeMatchedMap.js";
import { ErrorNode, PageError } from "./ErrorNode.js";
import {
  resetReloadForError,
  shouldReloadForError,
} from "../shouldReloadForError.js";
import { computeRealValue } from "./compute/computeRealValue.js";

type RenderTask = InitialRenderTask | SubsequentRenderTask;

interface InitialRenderTask {
  location: NextLocation;
  prevLocation?: undefined;
  action?: undefined;
}

interface SubsequentRenderTask {
  location: NextLocation;
  prevLocation: NextLocation;
  action: Action;
}

export class Router {
  readonly #storyboards: Storyboard[];
  #rendering = false;
  #nextRender?: RenderTask;
  #runtimeContext?: RuntimeContext;
  #rendererContext?: RendererContext;
  #rendererContextTrashCan = new Set<RendererContext | undefined>();
  #runtimeContextTrashCan = new Set<RuntimeContext | undefined>();
  #redirectCount = 0;
  #renderId?: string;
  #currentApp?: MicroApp;
  #previousApp?: MicroApp;
  #navConfig?: { breadcrumb?: BreadcrumbItemConf[] };
  #bootstrapFailed = false;

  constructor(storyboards: Storyboard[]) {
    this.#storyboards = storyboards;

    const history = getHistory();
    window.addEventListener("beforeunload", (event) => {
      const message = this.#getBlockMessageBeforePageLave({});
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
      this.#getBlockMessageBeforePageLave({ location, action })
    );
  }

  getRenderId() {
    return this.#renderId;
  }

  // istanbul ignore next
  getRuntimeContext() {
    return this.#runtimeContext;
  }

  getRecentApps() {
    return { currentApp: this.#currentApp, previousApp: this.#previousApp };
  }

  getNavConfig() {
    return this.#navConfig;
  }

  #getBlockMessageBeforePageLave(detail: {
    location?: NextLocation;
    action?: Action;
  }): string | undefined {
    const history = getHistory();
    const previousMessage = history.getBlockMessage();
    this.#rendererContext?.dispatchBeforePageLeave(detail);
    const message = history.getBlockMessage();
    if (!previousMessage && message) {
      // Auto unblock only if new block was introduced by `onBeforePageLeave`.
      history.unblock();
    }
    return message;
  }

  #safeRedirect(
    to: string,
    state: NextHistoryState | undefined,
    from: NextLocation
  ): void {
    if (this.#redirectCount++ > 10) {
      const message = `Infinite redirect detected: from "${from.pathname}${from.search}${from.hash}" to "${to}"`;
      // istanbul ignore else: error cannot be caught in test
      if (process.env.NODE_ENV === "test") {
        // eslint-disable-next-line no-console
        console.error(message);
        return;
      } else {
        throw new Error(message);
      }
    }
    getHistory().replace(to, state);
  }

  bootstrap() {
    initAbortController();
    const history = getHistory();
    let nextPrevLocation = history.location;
    history.listen((location, action) => {
      const prevLocation = nextPrevLocation;
      nextPrevLocation = location;
      if (this.#rendering) {
        this.#nextRender = { location, prevLocation, action };
      } else {
        this.#queuedRender({ location, prevLocation, action }).catch(
          handleHttpError
        );
      }
    });
    return this.#queuedRender({ location: history.location });
  }

  async #queuedRender(next: RenderTask) {
    this.#rendering = true;
    try {
      await this.#preRender(next);
    } finally {
      this.#rendering = false;
      if (this.#nextRender) {
        const nextRender = this.#nextRender;
        this.#nextRender = undefined;
        await this.#queuedRender(nextRender);
      }
    }
  }

  async #preRender({ location, prevLocation, action }: RenderTask) {
    if (prevLocation) {
      let ignoreRendering: boolean | undefined;
      const omittedLocationProps: Partial<NextLocation> = {
        hash: undefined,
        state: undefined,
      };
      // Omit the "key" when checking whether locations are equal in certain situations.
      if (
        // When current location is triggered by browser action of hash link.
        location.key === undefined ||
        // When current location is triggered by browser action of non-push-or-replace,
        // such as goBack or goForward,
        (action === "POP" &&
          // and the previous location was triggered by hash link,
          (prevLocation.key === undefined ||
            // or the previous location specified notify false.
            prevLocation.state?.notify === false))
      ) {
        omittedLocationProps.key = undefined;
      }
      if (
        locationsAreEqual(
          { ...prevLocation, ...omittedLocationProps },
          { ...location, ...omittedLocationProps }
        ) ||
        (action !== "POP" && location.state?.notify === false)
      ) {
        // Ignore rendering if location not changed except hash, state and optional key.
        // Ignore rendering if notify is `false`.
        ignoreRendering = true;
      }

      // Note: dot not perform incremental render when bootstrap failed.
      if (
        !ignoreRendering &&
        !location.state?.noIncremental &&
        !this.#bootstrapFailed
      ) {
        ignoreRendering =
          await this.#rendererContext?.didPerformIncrementalRender(
            location,
            prevLocation
          );
      }

      if (ignoreRendering) {
        return;
      }

      abortPendingRequest();
      this.#rendererContext?.dispatchPageLeave();

      if (action === "POP") {
        const storyboard = matchStoryboard(
          this.#storyboards,
          location.pathname
        );
        // When a browser action of goBack or goForward is performing,
        // force reload when the target page is a page of an outside app.
        if (isOutsideApp(storyboard)) {
          window.location.reload();
          return;
        }
      }

      devtoolsHookEmit("locationChange");
    }

    return this.#render(location, !prevLocation);
  }

  async #render(location: NextLocation, isBootstrap: boolean): Promise<void> {
    const renderId = (this.#renderId = uniqueId("render-id-"));

    resetAllComputedMarks();
    clearResolveCache();
    hooks?.flowApi?.clearCollectWidgetContract();

    const history = getHistory();
    history.unblock();

    // const renderStartTime = performance.now();
    const finishPageView = hooks?.pageView?.create();

    const storyboard = matchStoryboard(this.#storyboards, location.pathname);

    const previousApp = this.#runtimeContext?.app;
    const currentAppId = storyboard?.app?.id;
    //  dynamically change the value of the APP variable, if it's union app
    if (
      window.BOOTSTRAP_UNION_FILE &&
      currentAppId &&
      currentAppId !== previousApp?.id
    ) {
      setAppVariable({
        appId: currentAppId,
        version: storyboard.app.currentVersion!,
      });
    }

    if (storyboard?.app) {
      await fulfilStoryboard(storyboard);
    }

    const currentApp = (this.#currentApp = storyboard?.app);

    // Set `Router::#currentApp` before calling `getFeatureFlags()`
    // 必须在 currentApp 设置后调用，才能获取应用级的 feature flags
    const flags = getRuntime().getFeatureFlags();
    const blackListPreserveQueryFlag = flags["blacklist-preserve-query-string"];

    // 第一次检查：全局黑名单
    const pathToCheck = `${location.pathname}${blackListPreserveQueryFlag ? location.search : ""}`;
    let blocked = hooks?.auth?.isBlockedPath?.(pathToCheck);

    if (currentApp) {
      storyboard?.meta?.blackList?.forEach?.((item) => {
        let path = item && (item.to || item.url);

        if (!path || typeof path !== "string") return;

        // 保留查询字符串（如果特性开关启用）
        const pathParts = path.split("?");
        const pathWithoutQuery = pathParts[0];
        const queryString =
          blackListPreserveQueryFlag && pathParts[1] ? `?${pathParts[1]}` : "";

        path =
          pathWithoutQuery.replace(
            /\${\s*(?:(?:PATH|CTX)\.)?(\w+)\s*}/g,
            ":$1"
          ) + queryString;

        if (item.to) {
          try {
            path = computeRealValue(path, {
              app: currentApp,
            } as RuntimeContext) as string;
          } catch (e) /* istanbul ignore next */ {
            // eslint-disable-next-line no-console
            console.error(e);
          }
        } else {
          path = path.replace(/^\/next\//, "/");
        }

        path && path.startsWith("/") && hooks?.auth?.addPathToBlackList?.(path);
      });

      // 重新检查：全局黑名单 + 应用级黑名单
      blocked = hooks?.auth?.isBlockedPath?.(pathToCheck);
    }

    setWatermark();

    // Storyboard maybe re-assigned, e.g. when open launchpad.
    const appChanged =
      previousApp && currentApp
        ? previousApp.id !== currentApp.id
        : previousApp !== currentApp;

    clearExpressionASTCache();
    if (appChanged) {
      clearFunctionASTCache();
    }

    // TODO: handle favicon
    const prevRendererContext = this.#rendererContext;
    const prevRuntimeContext = this.#runtimeContext;

    const redirectTo = (to: string, state?: NextHistoryState): void => {
      finishPageView?.({ status: "redirected" });
      this.#rendererContextTrashCan.add(prevRendererContext);
      this.#runtimeContextTrashCan.add(prevRuntimeContext);
      this.#safeRedirect(to, state, location);
    };

    const redirectToLogin = (): void => {
      const to = flags["sso-enabled"] ? "/sso-auth/login" : "/auth/login";
      setLoginStateCookie(location);
      redirectTo(to, { from: location });
    };

    const main = document.querySelector("#main-mount-point") as HTMLElement;
    const portal = document.querySelector("#portal-mount-point") as HTMLElement;

    const renderRoot: RenderRoot = {
      tag: RenderTag.ROOT,
      container: main,
      createPortal: portal,
    };

    let disposeMount: Dispose | undefined;

    const cleanUpPreviousRender = (): void => {
      disposeMount?.();
      disposeMount = undefined;
      unmountTree(main);
      unmountTree(portal);

      // Note: redirects can lead to multiple trash renderer contexts.
      this.#rendererContextTrashCan.add(prevRendererContext);
      for (const item of this.#rendererContextTrashCan) {
        if (item) {
          item.dispatchOnUnmount();
          item.dispose();
        }
      }
      this.#rendererContextTrashCan.clear();

      this.#runtimeContextTrashCan.add(prevRuntimeContext);
      this.#runtimeContextTrashCan.forEach((item) => {
        if (item) {
          const stores = getDataStores(item);
          for (const store of stores) {
            store.dispose();
          }
        }
      });
      this.#runtimeContextTrashCan.clear();

      hooks?.messageDispatcher?.reset();

      if (appChanged) {
        this.#previousApp = previousApp;
        window.dispatchEvent(
          new CustomEvent("app.change", { detail: { previousApp, currentApp } })
        );
      }
    };

    setTheme(
      (currentApp &&
        (getLocalAppsTheme()[currentApp.id] || currentApp.theme)) ||
        "light"
    );
    setMode("default");
    setThemeVariant(getRuntime().getMiscSettings().globalThemeVariant);

    if (currentApp && !blocked) {
      hooks?.checkInstalledApps?.preCheckInstalledApps(
        storyboard,
        (appId) => !!_internalApiGetAppInBootstrapData(appId)
      );

      const routeHelper: RouteHelper = {
        bailout: (output) => {
          if (output.unauthenticated) {
            redirectToLogin();
            return true;
          }
          if (output.redirect) {
            redirectTo(output.redirect.path, output.redirect.state);
            return true;
          }
          // Reset redirect count if no redirect is set.
          this.#redirectCount = 0;
        },
        mergeMenus: async (menuRequests) => {
          const menuConfs = await Promise.all(menuRequests);
          this.#navConfig = mergeMenuConfs(menuConfs);
          window.dispatchEvent(
            new CustomEvent("navConfig.change", { detail: this.#navConfig })
          );
        },
        catch: async (error, returnNode, isCurrentBootstrap, isReCatch) => {
          if (isUnauthenticatedError(error) && !window.NO_AUTH_GUARD) {
            redirectToLogin();
            return;
          } else if (error instanceof HttpAbortError) {
            this.#rendererContextTrashCan.add(prevRendererContext);
            this.#runtimeContextTrashCan.add(prevRuntimeContext);
            return;
          } else {
            const noAuthGuardLoginPath =
              getRuntime().getMiscSettings().noAuthGuardLoginPath;
            if (isUnauthenticatedError(error) && noAuthGuardLoginPath) {
              redirectTo(noAuthGuardLoginPath as string, { from: location });
              return;
            }
            if (isCurrentBootstrap) {
              throw error;
            }
            if (!isReCatch && shouldReloadForError(error)) {
              window.location.reload();
              return;
            }
            return {
              failed: true,
              output: {
                node: await ErrorNode(error, returnNode, !isReCatch),
                blockingList: [],
              },
            };
          }
        },
      };

      const rendererContext = (this.#rendererContext = new RendererContext(
        "page",
        { routeHelper, renderId }
      ));

      const runtimeContext: RuntimeContext = (this.#runtimeContext = {
        app: currentApp,
        location,
        query: new URLSearchParams(location.search),
        flags,
        sys: {
          ...hooks?.auth?.getAuth(),
          ...getPageInfo(),
          settings: { brand: getRuntime().getBrandSettings() },
        },
        ctxStore: new DataStore("CTX", undefined, rendererContext),
        pendingPermissionsPreCheck: [
          hooks?.checkPermissions?.preCheckPermissions(storyboard),
        ],
        tplStateStoreMap: new Map<string, DataStore<"STATE">>(),
        formStateStoreMap: new Map<string, DataStore<"FORM_STATE">>(),
      });

      this.#navConfig = undefined;

      registerCustomTemplates(storyboard);
      registerStoryboardFunctions(storyboard.meta?.functions, currentApp);
      hooks?.flowApi?.collectContract(storyboard.meta?.contracts);

      let failed = false;
      let output: RenderOutput;
      let stores: DataStore<"CTX" | "STATE" | "FORM_STATE">[] = [];

      try {
        clearMatchedRoutes();
        const rootMenuRequestNode: MenuRequestNode = {};
        output = await renderRoutes(
          renderRoot,
          insertPreviewRoutes(storyboard.routes),
          runtimeContext,
          rendererContext,
          [],
          rootMenuRequestNode
        );
        if (routeHelper.bailout(output)) {
          return;
        }

        stores = getDataStores(runtimeContext);

        await postAsyncRender(output, runtimeContext, stores);

        rootMenuRequestNode.child = output.menuRequestNode;
        rendererContext.setInitialMenuRequestNode(rootMenuRequestNode);
        await routeHelper.mergeMenus(rendererContext.getMenuRequests());
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Router failed:", error);
        if (isBootstrap) {
          this.#bootstrapFailed = true;
        }
        const result = await routeHelper.catch(error, renderRoot, isBootstrap);
        if (!result) {
          return;
        }
        ({ failed, output } = result);
      }
      resetReloadForError();
      renderRoot.child = output.node;
      this.#bootstrapFailed = false;

      cleanUpPreviousRender();

      if ((output.route && output.route.type !== "routes") || failed) {
        if (!failed) {
          // There is a window to set theme and mode by `lifeCycle.onBeforePageLoad`.
          rendererContext.dispatchBeforePageLoad();
        }
        applyTheme();
        applyMode();

        setUIVersion(currentApp?.uiVersion);
        disposeMount = mountTree(renderRoot);

        // Scroll to top after each rendering.
        // See https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/docs/guides/scroll-restoration.md
        window.scrollTo(0, 0);

        if (!failed) {
          rendererContext.dispatchPageLoad();
          rendererContext.dispatchAnchorLoad();
          rendererContext.dispatchOnMount();
          rendererContext.initializeScrollIntoView();
          rendererContext.initializeMediaChange();
          rendererContext.initializeMessageDispatcher();

          for (const store of stores) {
            store.mountAsyncData();
          }

          finishPageView?.({
            status: "ok",
            path: output.path,
            pageTitle: document.title,
          });
        } else {
          finishPageView?.({ status: "failed" });
        }
        devtoolsHookEmit("rendered");

        return;
      }
    } else if (
      !window.NO_AUTH_GUARD &&
      hooks?.auth &&
      !hooks.auth.isLoggedIn()
    ) {
      // Todo(steve): refine after api-gateway supports fetching storyboards before logged in.
      // Redirect to login if no storyboard is matched.
      redirectToLogin();
      return;
    } else {
      cleanUpPreviousRender();
    }

    applyTheme();
    applyMode();

    const node = await ErrorNode(
      new PageError(
        blocked
          ? "page blocked"
          : currentApp
            ? "page not found"
            : "app not found"
      ),
      renderRoot,
      true
    );
    renderRoot.child = node;

    disposeMount = mountTree(renderRoot);

    // Scroll to top after each rendering.
    window.scrollTo(0, 0);
    finishPageView?.({ status: blocked ? "blocked" : "not-found" });
    devtoolsHookEmit("rendered");
  }
}

function mergeMenuConfs(menuConfs: StaticMenuConf[]) {
  const navConfig = { breadcrumb: [] as BreadcrumbItemConf[] };
  for (const menuConf of menuConfs) {
    const { breadcrumb } = menuConf;
    if (breadcrumb) {
      if (breadcrumb.overwrite) {
        navConfig.breadcrumb = breadcrumb.items;
      } else {
        navConfig.breadcrumb.push(...breadcrumb.items);
      }
    }
  }
  return navConfig;
}
