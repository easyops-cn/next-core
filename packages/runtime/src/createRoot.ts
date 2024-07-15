import type {
  BrickConf,
  ContextConf,
  CustomTemplate,
  MetaI18n,
  MicroApp,
  SiteTheme,
  Storyboard,
  StoryboardFunction,
} from "@next-core/types";
import { i18n } from "@next-core/i18n";
import { uniqueId } from "lodash";
import {
  RenderOutput,
  getDataStores,
  postAsyncRender,
  renderBricks,
} from "./internal/Renderer.js";
import { RendererContext } from "./internal/RendererContext.js";
import { DataStore } from "./internal/data/DataStore.js";
import type { RenderRoot, RuntimeContext } from "./internal/interfaces.js";
import { mountTree, unmountTree } from "./internal/mount.js";
import { httpErrorToString } from "./handleHttpError.js";
import { applyMode, applyTheme, setMode, setTheme } from "./themeAndMode.js";
import { RenderTag } from "./internal/enums.js";
import { registerStoryboardFunctions } from "./internal/compute/StoryboardFunctions.js";
import { registerAppI18n } from "./internal/registerAppI18n.js";
import { registerCustomTemplates } from "./internal/registerCustomTemplates.js";
import { setUIVersion } from "./setUIVersion.js";

export interface CreateRootOptions {
  portal?: HTMLElement;
  /**
   * Defaults to "fragment", only set it to "page" when the root is in a standalone iframe.
   * - page: render as whole page, triggering page life cycles, and enable register of functions/templates/i18n.
   * - fragment: render as fragment, not triggering page life cycles, and disable register of functions/templates/i18n.
   */
  scope?: "page" | "fragment";

  /**
   * Whether to throw error when encountering unknown bricks.
   *
   * Defaults to "throw".
   */
  unknownBricks?: "silent" | "throw";
}

export interface RenderOptions {
  theme?: SiteTheme;
  uiVersion?: string;
  language?: string;
  context?: ContextConf[];
  functions?: StoryboardFunction[];
  templates?: CustomTemplate[];
  i18n?: MetaI18n;
  url?: string;
  app?: MicroApp;
}

export function unstable_createRoot(
  container: HTMLElement | DocumentFragment,
  { portal: _portal, scope = "fragment", unknownBricks }: CreateRootOptions = {}
) {
  let portal = _portal;
  let createPortal: RenderRoot["createPortal"];
  if (_portal) {
    createPortal = _portal;
  } else {
    // Create portal container when necessary.
    createPortal = () => {
      portal = document.createElement("div");
      portal.style.position = "absolute";
      portal.style.width = portal.style.height = "0";
      document.body.append(portal);
      return portal;
    };
  }
  let unmounted = false;
  let rendererContext: RendererContext | undefined;
  let clearI18nBundles: Function | undefined;

  return {
    async render(
      brick: BrickConf | BrickConf[],
      {
        theme,
        uiVersion,
        language,
        context,
        functions,
        templates,
        i18n: i18nData,
        url,
        app,
      }: RenderOptions = {}
    ) {
      if (unmounted) {
        throw new Error(
          "The root is unmounted and cannot be rendered any more"
        );
      }
      const bricks = ([] as BrickConf[]).concat(brick);

      const previousRendererContext = rendererContext;
      const renderId = uniqueId("render-id-");
      rendererContext = new RendererContext(scope, { unknownBricks, renderId });

      const runtimeContext = {
        ctxStore: new DataStore("CTX", undefined, rendererContext),
        pendingPermissionsPreCheck: [],
        tplStateStoreMap: new Map<string, DataStore<"STATE">>(),
        formStateStoreMap: new Map<string, DataStore<"FORM_STATE">>(),
      } as Partial<RuntimeContext> as RuntimeContext;

      if (url) {
        const urlObj = new URL(url);
        runtimeContext.query = urlObj.searchParams;
        runtimeContext.location = {
          pathname: urlObj.pathname,
          search: urlObj.search,
          hash: urlObj.hash,
          state: undefined,
        };
      }

      const renderRoot: RenderRoot = {
        tag: RenderTag.ROOT,
        container,
        createPortal,
      };

      if (scope === "page") {
        setTheme(theme ?? "light");
        setMode("default");
        setUIVersion(uiVersion);
        if (language) {
          await i18n.changeLanguage(language);
        }

        app ??= {
          id: "demo",
          homepage: "/demo",
        } as MicroApp;
        runtimeContext.app = app;
        const demoStoryboard = {
          app,
          meta: {
            i18n: i18nData,
            customTemplates: templates,
          },
        } as Storyboard;

        // Register i18n.
        clearI18nBundles?.();
        clearI18nBundles = registerAppI18n(demoStoryboard);

        // Register custom templates.
        registerCustomTemplates(demoStoryboard);

        // Register functions.
        registerStoryboardFunctions(functions, app);
      }

      runtimeContext.ctxStore.define(context, runtimeContext);

      let failed = false;
      let output: RenderOutput;
      let stores: DataStore<"CTX" | "STATE" | "FORM_STATE">[] = [];

      try {
        output = await renderBricks(
          renderRoot,
          bricks,
          runtimeContext,
          rendererContext,
          [],
          {}
        );

        stores = getDataStores(runtimeContext);
        await postAsyncRender(output, runtimeContext, stores);
      } catch (error) {
        failed = true;
        output = {
          node: {
            tag: RenderTag.BRICK,
            type: "div",
            properties: {
              textContent: httpErrorToString(error),
              dataset: {
                errorBoundary: "",
              },
              style: {
                color: "var(--color-error)",
              },
            },
            return: renderRoot,
            runtimeContext: null!,
          },
          blockingList: [],
        };
      }

      renderRoot.child = output.node;

      previousRendererContext?.dispatchOnUnmount();
      previousRendererContext?.dispose();
      unmountTree(container);
      if (portal) {
        unmountTree(portal);
      }

      if (scope === "page") {
        if (!failed) {
          rendererContext.dispatchBeforePageLoad();
        }

        applyTheme();
        applyMode();
      }

      mountTree(renderRoot);

      if (scope === "page") {
        window.scrollTo(0, 0);
      }

      if (!failed) {
        for (const store of stores) {
          store.mountAsyncData();
        }

        if (scope === "page") {
          rendererContext.dispatchPageLoad();
          // rendererContext.dispatchAnchorLoad();
        }
        rendererContext.dispatchOnMount();
        rendererContext.initializeScrollIntoView();
        rendererContext.initializeMediaChange();
        rendererContext.initializeMessageDispatcher();
      }
    },
    unmount() {
      if (unmounted) {
        return;
      }
      unmounted = true;
      unmountTree(container);
      if (portal) {
        unmountTree(portal);
        // Only remove the portal from its parent when it's dynamic created.
        if (!_portal) {
          portal.remove();
        }
      }
    },
  };
}
