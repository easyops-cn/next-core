import { Action, Location, locationsAreEqual } from "history";
import {
  flushStableLoadBricks,
  loadProcessorsImperatively,
} from "@next-core/loader";
import type {
  MicroApp,
  PluginHistoryState,
  PluginLocation,
} from "@next-core/brick-types";
import { strictCollectMemberUsage } from "@next-core/utils/storyboard";
import { isHttpAbortError } from "@next-core/brick-http";
import { uniqueId } from "lodash";
import { getHistory } from "../history.js";
import type { Kernel } from "./Kernel.js";
import { RenderOutput, renderRoutes } from "./Renderer.js";
import { DataStore } from "./data/DataStore.js";
import { clearResolveCache } from "./data/resolveData.js";
import { afterMountTree, mountTree, unmountTree } from "./mount.js";
import { isOutsideApp, matchStoryboard } from "./matchStoryboard.js";
import { customTemplates } from "../CustomTemplates.js";
import { registerStoryboardFunctions } from "./compute/StoryboardFunctions.js";
import { preCheckPermissions } from "./checkPermissions.js";
import { RendererContext } from "./RendererContext.js";
import {
  applyMode,
  applyTheme,
  getLocalAppsTheme,
  setMode,
  setTheme,
} from "../themeAndMode.js";
import { getRuntime } from "./Runtime.js";
import { getAuth } from "../auth.js";
import { getPageInfo } from "../getPageInfo.js";
import type { RuntimeContext } from "./interfaces.js";
import { resetAllComputed } from "./compute/markAsComputed.js";
import {
  handleHttpError,
  httpErrorToString,
  isUnauthenticatedError,
} from "../handleHttpError.js";

export class Router {
  #kernel: Kernel;
  #rendering = false;
  #prevLocation!: PluginLocation;
  #nextLocation?: PluginLocation;
  #runtimeContext?: RuntimeContext;
  #rendererContext?: RendererContext;
  #rendererContextTrashCan = new Set<RendererContext | undefined>();
  #redirectCount = 0;
  #renderId?: string;
  #currentApp?: MicroApp;

  constructor(kernel: Kernel) {
    this.#kernel = kernel;

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

  getCurrentApp() {
    return this.#currentApp;
  }

  getRuntimeContext() {
    return this.#runtimeContext;
  }

  #getBlockMessageBeforePageLave(detail: {
    location?: Location<PluginHistoryState>;
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

  #checkInfiniteRedirect(from: PluginLocation, to: string): void {
    if (this.#redirectCount++ > 10) {
      throw new Error(
        `Infinite redirect detected: from "${from.pathname}${from.search}${from.hash}" to "${to}"`
      );
    }
  }

  bootstrap() {
    const history = getHistory();
    this.#prevLocation = history.location;
    history.listen((location, action) => {
      let ignoreRendering = false;
      const omittedLocationProps: Partial<PluginLocation> = {
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
      if (ignoreRendering) {
        this.#prevLocation = location;
        return;
      }
      // abortController.abortPendingRequest();
      this.#prevLocation = location;
      this.#rendererContext?.dispatchPageLeave();
      // this.locationContext.messageDispatcher.reset();

      if (action === "POP") {
        const storyboard = matchStoryboard(
          this.#kernel.bootstrapData.storyboards,
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

  async #queuedRender(location: PluginLocation): Promise<void> {
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

  async #render(location: PluginLocation): Promise<void> {
    this.#renderId = uniqueId("render-id-1");

    resetAllComputed();
    clearResolveCache();

    const history = getHistory();
    history.unblock();

    const storyboard = matchStoryboard(
      this.#kernel.bootstrapData.storyboards,
      location.pathname
    );

    const previousApp = this.#runtimeContext?.app;
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

    const redirectTo = (to: string, state?: PluginHistoryState): void => {
      this.#rendererContextTrashCan.add(prevRendererContext);
      this.#checkInfiniteRedirect(location, to);
      history.replace(to, state);
    };

    const redirectToLogin = (): void => {
      const to = flags["sso-enabled"] ? "/sso-auth/login" : "/auth/login";
      redirectTo(to, { from: location });
    };

    const main = document.querySelector("#main-mount-point") as HTMLElement;
    const portal = document.querySelector("#portal-mount-point") as HTMLElement;

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

      setTheme(
        (currentApp &&
          (getLocalAppsTheme()[currentApp.id] || currentApp.theme)) ||
          "light"
      );
      setMode("default");

      if (appChanged) {
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

    if (currentApp) {
      const runtimeContext: RuntimeContext = (this.#runtimeContext = {
        app: currentApp,
        location,
        query: new URLSearchParams(location.search),
        flags,
        sys: {
          ...getAuth(),
          ...getPageInfo(),
        },
        ctxStore: new DataStore("CTX"),
        brickPackages: this.#kernel.bootstrapData.brickPackages,
        pendingPermissionsPreCheck: [preCheckPermissions(storyboard)],
        tplStateStoreMap: new Map<string, DataStore<"STATE">>(),
      });

      const rendererContext = (this.#rendererContext = new RendererContext(
        "router"
      ));

      if (!storyboard.$$registerCustomTemplateProcessed) {
        const templates = storyboard.meta?.customTemplates;
        if (Array.isArray(templates)) {
          for (const tpl of templates) {
            const tagName = tpl.name.includes(".")
              ? tpl.name
              : `${currentApp.id}.${tpl.name}`;
            customTemplates.define(tagName, tpl);
          }
        }
        storyboard.$$registerCustomTemplateProcessed = true;
      }

      registerStoryboardFunctions(storyboard.meta?.functions, currentApp);

      let failed = false;
      let output: RenderOutput;
      try {
        output = await renderRoutes(
          storyboard.routes,
          runtimeContext,
          rendererContext
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

        output.blockingList.push(
          runtimeContext.ctxStore.waitForAll(),
          ...[...runtimeContext.tplStateStoreMap.values()].map((store) =>
            store.waitForAll()
          ),
          // Todo: load processors only when they would used in current rendering.
          // loadProcessorsImperatively(
          //   strictCollectMemberUsage(
          //     [storyboard.routes, storyboard.meta?.customTemplates],
          //     "PROCESSORS",
          //     2
          //   ),
          //   runtimeContext.brickPackages
          // ),
          ...runtimeContext.pendingPermissionsPreCheck
        );
        await Promise.all(output.blockingList);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Router failed:", error);

        if (isUnauthenticatedError(error) && !window.NO_AUTH_GUARD) {
          redirectToLogin();
          return;
        } else if (isHttpAbortError(error)) {
          this.#rendererContextTrashCan.add(prevRendererContext);
          return;
        } else {
          failed = true;
          output = {
            main: [
              {
                type: "div",
                properties: {
                  textContent: httpErrorToString(error),
                },
                children: [],
                runtimeContext: null!,
              },
            ],
            portal: [],
            blockingList: [],
          };
        }
      }

      cleanUpPreviousRender();

      if ((output.route && output.route.type !== "routes") || failed) {
        if (!failed) {
          // There is a window to set theme and mode by `lifeCycle.onBeforePageLoad`.
          rendererContext.dispatchBeforePageLoad();
        }
        applyTheme();
        applyMode();

        mountTree(output.main, main);
        mountTree(output.portal, portal);

        afterMountTree(main);
        afterMountTree(portal);

        // Scroll to top after each rendering.
        // See https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/docs/guides/scroll-restoration.md
        window.scrollTo(0, 0);

        if (!failed) {
          rendererContext.dispatchPageLoad();
          rendererContext.dispatchAnchorLoad();
          rendererContext.dispatchOnMount();
          rendererContext.initializeScrollIntoView();
          rendererContext.initializeMediaChange();
        }

        return;
      }
    } else if (!window.NO_AUTH_GUARD /* && !isLoggedIn() */) {
      // Todo(steve): refine after api-gateway supports fetching storyboards before logged in.
      // Redirect to login if no storyboard is matched.
      redirectToLogin();
      return;
    } else {
      cleanUpPreviousRender();
    }

    applyTheme();
    applyMode();

    mountTree(
      [
        {
          type: "div",
          properties: {
            textContent: "Page not found",
          },
          children: [],
          runtimeContext: null!,
        },
      ],
      main
    );

    // Scroll to top after each rendering.
    window.scrollTo(0, 0);
  }
}
