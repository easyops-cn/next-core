import { Action, locationsAreEqual } from "history";
import { flushStableLoadBricks } from "@next-core/loader";
import type {
  BreadcrumbItemConf,
  MicroApp,
  StaticMenuConf,
  Storyboard,
} from "@next-core/types";
import { HttpAbortError } from "@next-core/http";
import { uniqueId } from "lodash";
import { NextHistoryState, NextLocation, getHistory } from "../history.js";
import { RenderOutput, renderRoutes } from "./Renderer.js";
import { DataStore } from "./data/DataStore.js";
import { clearResolveCache } from "./data/resolveData.js";
import { mountTree, unmountTree } from "./mount.js";
import { isOutsideApp, matchStoryboard } from "./matchStoryboard.js";
import { registerStoryboardFunctions } from "./compute/StoryboardFunctions.js";
import { RendererContext } from "./RendererContext.js";
import {
  applyMode,
  applyTheme,
  getLocalAppsTheme,
  setMode,
  setTheme,
} from "../themeAndMode.js";
import {
  _internalApiGetAppInBootstrapData,
  getRuntime,
  hooks,
} from "./Runtime.js";
import { getPageInfo } from "../getPageInfo.js";
import type { RenderBrick, RenderRoot, RuntimeContext } from "./interfaces.js";
import { resetAllComputedMarks } from "./compute/markAsComputed.js";
import {
  handleHttpError,
  httpErrorToString,
  isUnauthenticatedError,
} from "../handleHttpError.js";
import { abortPendingRequest, initAbortController } from "./abortController.js";
import { registerCustomTemplates } from "./registerCustomTemplates.js";
import { fulfilStoryboard } from "./fulfilStoryboard.js";
import { RenderTag } from "./enums.js";
import { insertPreviewRoutes } from "./insertPreviewRoutes.js";

export class Router {
  readonly #storyboards: Storyboard[];
  #rendering = false;
  #prevLocation!: NextLocation;
  #nextLocation?: NextLocation;
  #runtimeContext?: RuntimeContext;
  #rendererContext?: RendererContext;
  #rendererContextTrashCan = new Set<RendererContext | undefined>();
  #redirectCount = 0;
  #renderId?: string;
  #currentApp?: MicroApp;
  #previousApp?: MicroApp;
  #navConfig?: {
    breadcrumb?: BreadcrumbItemConf[];
  };

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

  getRuntimeContext() {
    return this.#runtimeContext;
  }

  getRecentApps() {
    return {
      currentApp: this.#currentApp,
      previousApp: this.#previousApp,
    };
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
    this.#prevLocation = history.location;
    let renderId = 0;
    history.listen(async (location, action) => {
      const currentRenderId = ++renderId;
      let ignoreRendering = false;
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
          (this.#prevLocation.key === undefined ||
            // or the previous location specified notify false.
            this.#prevLocation.state?.notify === false))
      ) {
        omittedLocationProps.key = undefined;
      }
      if (
        locationsAreEqual(
          { ...this.#prevLocation, ...omittedLocationProps },
          { ...location, ...omittedLocationProps }
        ) ||
        (action !== "POP" && location.state?.notify === false)
      ) {
        // Ignore rendering if location not changed except hash, state and optional key.
        // Ignore rendering if notify is `false`.
        ignoreRendering = true;
      }

      if (!ignoreRendering) {
        ignoreRendering =
          (await this.#rendererContext?.didPerformIncrementalRender(
            location
          )) ?? false;
      }

      // Ignore stale renders
      if (renderId !== currentRenderId) {
        return;
      }

      if (ignoreRendering) {
        this.#prevLocation = location;
        return;
      }

      abortPendingRequest();
      this.#prevLocation = location;
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

      if (this.#rendering) {
        this.#nextLocation = location;
      } else {
        // devtoolsHookEmit("locationChange");
        this.#queuedRender(location).catch(handleHttpError);
      }
    });
    return this.#queuedRender(history.location);
  }

  async #queuedRender(location: NextLocation): Promise<void> {
    this.#rendering = true;
    try {
      await this.#render(location);
    } finally {
      this.#rendering = false;
      if (this.#nextLocation) {
        const nextLocation = this.#nextLocation;
        this.#nextLocation = undefined;
        await this.#queuedRender(nextLocation);
      }
    }
  }

  async #render(location: NextLocation): Promise<void> {
    this.#renderId = uniqueId("render-id-1");

    resetAllComputedMarks();
    clearResolveCache();
    hooks?.flowApi?.clearCollectWidgetContract();

    const history = getHistory();
    history.unblock();

    const renderStartTime = performance.now();

    const storyboard = matchStoryboard(this.#storyboards, location.pathname);

    const previousApp = this.#runtimeContext?.app;
    if (storyboard?.app) {
      await fulfilStoryboard(storyboard);
    }
    const currentApp = (this.#currentApp = storyboard?.app);

    // Storyboard maybe re-assigned, e.g. when open launchpad.
    const appChanged =
      previousApp && currentApp
        ? previousApp.id !== currentApp.id
        : previousApp !== currentApp;

    // TODO: handle favicon

    // Set `Router::#currentApp` before calling `getFeatureFlags()`
    const flags = getRuntime().getFeatureFlags();
    const prevRendererContext = this.#rendererContext;

    const redirectTo = (to: string, state?: NextHistoryState): void => {
      this.#rendererContextTrashCan.add(prevRendererContext);
      this.#safeRedirect(to, state, location);
    };

    const redirectToLogin = (): void => {
      const to = flags["sso-enabled"] ? "/sso-auth/login" : "/auth/login";
      redirectTo(to, { from: location });
    };

    const main = document.querySelector("#main-mount-point") as HTMLElement;
    const portal = document.querySelector("#portal-mount-point") as HTMLElement;

    const renderRoot: RenderRoot = {
      tag: RenderTag.ROOT,
      container: main,
      createPortal: portal,
    };

    const cleanUpPreviousRender = (): void => {
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
      hooks?.messageDispatcher?.reset();

      if (appChanged) {
        this.#previousApp = previousApp;
        window.dispatchEvent(
          new CustomEvent("app.change", {
            detail: {
              previousApp,
              currentApp,
            },
          })
        );
      }
    };

    setTheme(
      (currentApp &&
        (getLocalAppsTheme()[currentApp.id] || currentApp.theme)) ||
        "light"
    );
    setMode("default");

    if (currentApp) {
      hooks?.checkInstalledApps?.preCheckInstalledApps(
        storyboard,
        (appId) => !!_internalApiGetAppInBootstrapData(appId)
      );

      const rendererContext = (this.#rendererContext = new RendererContext(
        "page"
      ));

      const runtimeContext: RuntimeContext = (this.#runtimeContext = {
        app: currentApp,
        location,
        query: new URLSearchParams(location.search),
        flags,
        sys: {
          ...hooks?.auth?.getAuth(),
          ...getPageInfo(),
          settings: {
            brand: getRuntime().getBrandSettings(),
          },
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
        output = await renderRoutes(
          renderRoot,
          insertPreviewRoutes(storyboard.routes),
          runtimeContext,
          rendererContext,
          []
        );
        if (output.unauthenticated) {
          redirectToLogin();
          return;
        }
        if (output.redirect) {
          redirectTo(output.redirect.path, output.redirect.state);
          return;
        }
        // Reset redirect count if no redirect is set.
        this.#redirectCount = 0;

        flushStableLoadBricks();

        stores = [
          runtimeContext.ctxStore,
          ...runtimeContext.tplStateStoreMap.values(),
          ...runtimeContext.formStateStoreMap.values(),
        ];

        await Promise.all([
          ...output.blockingList,
          ...stores.map((store) => store.waitForAll()),
          ...runtimeContext.pendingPermissionsPreCheck,
        ]);

        const menuConfs = await Promise.all(output.menuRequests);
        this.#navConfig = mergeMenuConfs(menuConfs);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Router failed:", error);

        if (isUnauthenticatedError(error) && !window.NO_AUTH_GUARD) {
          redirectToLogin();
          return;
        } else if (error instanceof HttpAbortError) {
          this.#rendererContextTrashCan.add(prevRendererContext);
          return;
        } else {
          failed = true;
          output = {
            node: {
              tag: RenderTag.BRICK,
              type: "div",
              properties: {
                textContent: httpErrorToString(error),
              },
              runtimeContext: null!,
              return: renderRoot,
            },
            blockingList: [],
            menuRequests: [],
          };
        }
      }
      renderRoot.child = output.node;

      cleanUpPreviousRender();

      if ((output.route && output.route.type !== "routes") || failed) {
        if (!failed) {
          // There is a window to set theme and mode by `lifeCycle.onBeforePageLoad`.
          rendererContext.dispatchBeforePageLoad();
        }
        applyTheme();
        applyMode();

        mountTree(renderRoot);

        // Scroll to top after each rendering.
        // See https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/docs/guides/scroll-restoration.md
        window.scrollTo(0, 0);

        if (!failed) {
          for (const store of stores) {
            store.handleAsyncAfterMount();
          }

          rendererContext.dispatchPageLoad();
          rendererContext.dispatchAnchorLoad();
          rendererContext.dispatchOnMount();
          rendererContext.initializeScrollIntoView();
          rendererContext.initializeMediaChange();
          rendererContext.initializeMessageDispatcher();
        }

        const renderTime = performance.now() - renderStartTime;
        window.dispatchEvent(
          new CustomEvent("route.render", {
            detail: {
              renderTime,
            },
          })
        );

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

    const node: RenderBrick = {
      tag: RenderTag.BRICK,
      type: "div",
      properties: {
        textContent: "Page not found",
      },
      runtimeContext: null!,
      return: renderRoot,
    };
    renderRoot.child = node;

    mountTree(renderRoot);

    // Scroll to top after each rendering.
    window.scrollTo(0, 0);
  }
}

function mergeMenuConfs(menuConfs: (StaticMenuConf | undefined)[]) {
  const navConfig = {
    breadcrumb: [] as BreadcrumbItemConf[],
  };
  for (const menuConf of menuConfs) {
    if (menuConf) {
      const { breadcrumb } = menuConf;
      if (breadcrumb) {
        if (breadcrumb.overwrite) {
          navConfig.breadcrumb = breadcrumb.items;
        } else {
          navConfig.breadcrumb.push(...breadcrumb.items);
        }
      }
    }
  }
  return navConfig;
}
