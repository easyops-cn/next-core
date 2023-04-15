import type { BrickConf, SiteTheme } from "@next-core/types";
import { flushStableLoadBricks } from "@next-core/loader";
import { RenderOutput, renderBricks } from "./internal/Renderer.js";
import { RendererContext } from "./internal/RendererContext.js";
import type { DataStore } from "./internal/data/DataStore.js";
import type { RenderRoot, RuntimeContext } from "./internal/interfaces.js";
import { mountTree, unmountTree } from "./internal/mount.js";
import { httpErrorToString } from "./handleHttpError.js";
import { applyMode, applyTheme, setMode, setTheme } from "./themeAndMode.js";
import { RenderTag } from "./internal/enums.js";

export interface CreateRootOptions {
  portal?: HTMLElement;
  /** Defaults to "fragment" */
  scope?: "page" | "fragment";
}

export interface RenderOptions {
  theme?: SiteTheme;
}

export function unstable_createRoot(
  container: HTMLElement,
  { portal: _portal, scope }: CreateRootOptions = {}
) {
  let portal = _portal;
  let createPortal: RenderRoot["createPortal"];
  if (_portal) {
    createPortal = _portal;
  } else {
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

  return {
    async render(
      brick: BrickConf | BrickConf[],
      { theme }: RenderOptions = {}
    ) {
      if (unmounted) {
        throw new Error(
          "The root is unmounted and cannot be rendered any more"
        );
      }
      const bricks = ([] as BrickConf[]).concat(brick);
      const runtimeContext = {
        pendingPermissionsPreCheck: [],
        tplStateStoreMap: new Map<string, DataStore<"STATE">>(),
      } as Partial<RuntimeContext> as RuntimeContext;

      const previousRendererContext = rendererContext;
      rendererContext = new RendererContext("router");

      const renderRoot: RenderRoot = {
        tag: RenderTag.ROOT,
        container,
        createPortal,
      };

      let failed = false;
      let output: RenderOutput;
      try {
        output = await renderBricks(
          renderRoot,
          bricks,
          runtimeContext,
          rendererContext
        );

        output.blockingList.push(
          ...[...runtimeContext.tplStateStoreMap.values()].map((store) =>
            store.waitForAll()
          ),
          ...runtimeContext.pendingPermissionsPreCheck
        );

        flushStableLoadBricks();

        await Promise.all(output.blockingList);
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
        }
        // rendererContext.dispatchAnchorLoad();
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
