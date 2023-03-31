import type {
  BootstrapData,
  BrickConf,
  SiteTheme,
  UseSingleBrickConf,
} from "@next-core/types";
import { flushStableLoadBricks } from "@next-core/loader";
import {
  _internalApiGetRuntimeContext,
  _internalApiSetBootstrapData,
} from "./Runtime.js";
import { RenderOutput, renderBrick, renderBricks } from "./Renderer.js";
import { RendererContext } from "./RendererContext.js";
import type { DataStore } from "./data/DataStore.js";
import type { RenderRoot, RuntimeContext } from "./interfaces.js";
import { mountTree, unmountTree } from "./mount.js";
import { httpErrorToString } from "../handleHttpError.js";
import { applyMode, applyTheme, setMode, setTheme } from "../themeAndMode.js";
import { RenderTag } from "./enums.js";
import { computeRealValue } from "./compute/computeRealValue.js";

export interface RenderUseBrickResult {
  tagName: string | null;
  renderRoot: RenderRoot;
  rendererContext: RendererContext;
}

export async function renderUseBrick(
  useBrick: UseSingleBrickConf,
  data: unknown
): Promise<RenderUseBrickResult> {
  const runtimeContext: RuntimeContext = {
    ..._internalApiGetRuntimeContext()!,
    data,
    pendingPermissionsPreCheck: [],
    tplStateStoreMap: new Map<string, DataStore<"STATE">>(),
  };

  const rendererContext = new RendererContext("useBrick");

  const renderRoot: RenderRoot = {
    tag: RenderTag.ROOT,
    // Will set during `mountUseBrick`
    createPortal: null!,
  };

  const output = await renderBrick(
    renderRoot,
    useBrick as BrickConf,
    runtimeContext,
    rendererContext
  );

  flushStableLoadBricks();

  await Promise.all([
    ...output.blockingList,
    ...[...runtimeContext.tplStateStoreMap.values()].map((store) =>
      store.waitForAll()
    ),
    ...runtimeContext.pendingPermissionsPreCheck,
  ]);

  if (output.node?.portal) {
    throw new Error("The root brick of useBrick cannot be a portal brick");
  }

  renderRoot.child = output.node;

  const tagName = output.node ? output.node.type : null;

  return { tagName, renderRoot, rendererContext };
}

export interface MountUseBrickResult {
  portal?: HTMLElement;
}

export function mountUseBrick(
  { renderRoot, rendererContext }: RenderUseBrickResult,
  element: HTMLElement
): MountUseBrickResult {
  let portal: HTMLElement | undefined;
  renderRoot.createPortal = () => {
    const portalRoot = document.querySelector(
      "#portal-mount-point"
    ) as HTMLElement;
    portal = document.createElement("div");
    portalRoot.appendChild(portal);
    return portal;
  };

  mountTree(renderRoot, element);

  rendererContext.dispatchOnMount();
  rendererContext.initializeScrollIntoView();
  rendererContext.initializeMediaChange();

  return {
    portal,
  };
}

export function unmountUseBrick(
  { rendererContext }: RenderUseBrickResult,
  mountResult: MountUseBrickResult
): void {
  // if (mountResult.mainBrick) {
  //   mountResult.mainBrick.unmount();
  // }
  if (mountResult.portal) {
    unmountTree(mountResult.portal);
    mountResult.portal.remove();
  }
  rendererContext.dispatchOnUnmount();
  rendererContext.dispose();
}

let _rendererContext: RendererContext;

export function initializePreviewBootstrap(
  bootstrapData: Partial<BootstrapData>
) {
  _internalApiSetBootstrapData(bootstrapData);
}

export async function renderPreviewBricks(
  bricks: BrickConf[],
  mountPoints: {
    main: HTMLElement;
    portal: HTMLElement;
  },
  options?: {
    theme?: SiteTheme;
  }
) {
  const runtimeContext = {
    pendingPermissionsPreCheck: [],
    tplStateStoreMap: new Map<string, DataStore<"STATE">>(),
  } as Partial<RuntimeContext> as RuntimeContext;

  const previousRendererContext = _rendererContext;
  const rendererContext = (_rendererContext = new RendererContext("router"));

  const renderRoot: RenderRoot = {
    tag: RenderTag.ROOT,
    container: mountPoints.main,
    createPortal: mountPoints.portal,
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
  unmountTree(mountPoints.main);
  unmountTree(mountPoints.portal);

  setTheme(options?.theme ?? "light");
  setMode("default");

  if (!failed) {
    rendererContext.dispatchBeforePageLoad();
  }
  applyTheme();
  applyMode();

  mountTree(renderRoot);

  window.scrollTo(0, 0);

  if (!failed) {
    rendererContext.dispatchPageLoad();
    // rendererContext.dispatchAnchorLoad();
    rendererContext.dispatchOnMount();
    rendererContext.initializeScrollIntoView();
    rendererContext.initializeMediaChange();
  }
}

export function legacyDoTransform(
  data: unknown,
  to: unknown,
  options?: unknown
) {
  if (options) {
    throw new Error("Legacy doTransform does not support options in v3");
  }
  return computeRealValue(
    to,
    {
      ..._internalApiGetRuntimeContext()!,
      data,
    },
    {
      noInject: true,
    }
  );
}
