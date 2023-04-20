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
import { flushStableLoadBricks } from "@next-core/loader";
import { RenderOutput, renderBricks } from "./internal/Renderer.js";
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

export interface CreateRootOptions {
  portal?: HTMLElement;
  /**
   * Defaults to "fragment", only set it to "page" when the root is in a standalone iframe.
   * - page: render as whole page, triggering page life cycles, and enable register of functions/templates/i18n.
   * - fragment: render as fragment, not triggering page life cycles, and disable register of functions/templates/i18n.
   */
  scope?: "page" | "fragment";
}

export interface RenderOptions {
  theme?: SiteTheme;
  context?: ContextConf[];
  functions?: StoryboardFunction[];
  templates?: CustomTemplate[];
  i18n?: MetaI18n;
}

export function unstable_createRoot(
  container: HTMLElement,
  { portal: _portal, scope = "fragment" }: CreateRootOptions = {}
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
        context,
        functions,
        templates,
        i18n: i18nData,
      }: RenderOptions = {}
    ) {
      if (unmounted) {
        throw new Error(
          "The root is unmounted and cannot be rendered any more"
        );
      }
      const bricks = ([] as BrickConf[]).concat(brick);
      const runtimeContext = {
        ctxStore: new DataStore("CTX"),
        pendingPermissionsPreCheck: [],
        tplStateStoreMap: new Map<string, DataStore<"STATE">>(),
      } as Partial<RuntimeContext> as RuntimeContext;

      const previousRendererContext = rendererContext;
      rendererContext = new RendererContext(scope);

      const renderRoot: RenderRoot = {
        tag: RenderTag.ROOT,
        container,
        createPortal,
      };

      if (scope === "page") {
        const demoApp = {
          id: "demo",
          homepage: "/demo",
        } as MicroApp;
        runtimeContext.app = demoApp;
        const demoStoryboard = {
          app: demoApp,
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
        registerStoryboardFunctions(functions, demoApp);
      }

      runtimeContext.ctxStore.define(context, runtimeContext);

      let failed = false;
      let output: RenderOutput;
      try {
        output = await renderBricks(
          renderRoot,
          bricks,
          runtimeContext,
          rendererContext
        );

        flushStableLoadBricks();

        await Promise.all([
          ...output.blockingList,
          runtimeContext.ctxStore.waitForAll(),
          ...[...runtimeContext.tplStateStoreMap.values()].map((store) =>
            store.waitForAll()
          ),
          ...runtimeContext.pendingPermissionsPreCheck,
        ]);
      } catch (error) {
        failed = true;
        output = {
          node: {
            tag: RenderTag.BRICK,
            type: "div",
            properties: {
              textContent: httpErrorToString(error),
            },
            return: renderRoot,
            runtimeContext: null!,
          },
          blockingList: [],
          menuRequests: [],
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
        setTheme(theme ?? "light");
        setMode("default");

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
        if (scope === "page") {
          rendererContext.dispatchPageLoad();
          // rendererContext.dispatchAnchorLoad();
        }
        rendererContext.dispatchOnMount();
        rendererContext.initializeScrollIntoView();
        rendererContext.initializeMediaChange();
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
