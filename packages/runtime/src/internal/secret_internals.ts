import type {
  BrickConf,
  CustomTemplate,
  RouteConf,
  Storyboard,
  UseSingleBrickConf,
} from "@next-core/types";
import { flushStableLoadBricks } from "@next-core/loader";
import { pick } from "lodash";
import {
  _internalApiGetRenderId,
  _internalApiGetRuntimeContext,
  _internalApiGetStoryboardInBootstrapData,
  getBrickPackages,
} from "./Runtime.js";
import { renderBrick } from "./Renderer.js";
import { RendererContext } from "./RendererContext.js";
import type { DataStore } from "./data/DataStore.js";
import type {
  DataValueOption,
  RenderRoot,
  RuntimeContext,
} from "./interfaces.js";
import { mountTree, unmountTree } from "./mount.js";
import { RenderTag } from "./enums.js";
import { computeRealValue } from "./compute/computeRealValue.js";
import { isStrictMode, warnAboutStrictMode } from "../isStrictMode.js";
import { customTemplates } from "../CustomTemplates.js";
import { registerAppI18n } from "./registerAppI18n.js";
import { getTplStateStore } from "./CustomTemplates/utils.js";

export type { DataValueOption, RuntimeContext } from "./interfaces.js";

export interface RenderUseBrickResult {
  tagName: string | null;
  renderRoot: RenderRoot;
  rendererContext: RendererContext;
  scopedStores: DataStore<"STATE" | "FORM_STATE">[];
}

export async function renderUseBrick(
  useBrick: UseSingleBrickConf,
  data: unknown
): Promise<RenderUseBrickResult> {
  const tplStateStoreScope: DataStore<"STATE">[] = [];
  const formStateStoreScope: DataStore<"FORM_STATE">[] = [];
  const runtimeContext: RuntimeContext = {
    ..._internalApiGetRuntimeContext()!,
    data,
    pendingPermissionsPreCheck: [],
    tplStateStoreScope,
    formStateStoreScope,
  };

  runtimeContext.tplStateStoreMap ??= new Map();
  runtimeContext.formStateStoreMap ??= new Map();

  const rendererContext = new RendererContext("fragment");

  const renderRoot: RenderRoot = {
    tag: RenderTag.ROOT,
    // Will set during `mountUseBrick`
    createPortal: null!,
  };

  const transform = (useBrick as { transform?: Record<string, unknown> })
    .transform;
  const strict = isStrictMode();
  if (transform) {
    warnAboutStrictMode(
      strict,
      "`useBrick.transform`",
      'please use "properties" instead, check your useBrick:',
      useBrick
    );
  }

  const output = await renderBrick(
    renderRoot,
    strict
      ? useBrick
      : {
          ...useBrick,
          properties: {
            ...useBrick.properties,
            ...transform,
          },
        },
    runtimeContext,
    rendererContext
  );

  flushStableLoadBricks();

  const scopedStores: DataStore<"STATE" | "FORM_STATE">[] = [
    ...tplStateStoreScope,
    ...formStateStoreScope,
  ];

  await Promise.all([
    ...output.blockingList,
    // Wait for local tpl state stores belong to current `useBrick` only.
    ...scopedStores.map((store) => store.waitForAll()),
    ...runtimeContext.pendingPermissionsPreCheck,
  ]);

  if (output.node?.portal) {
    throw new Error("The root brick of useBrick cannot be a portal brick");
  }

  renderRoot.child = output.node;

  const tagName = output.node ? output.node.type : null;

  return { tagName, renderRoot, rendererContext, scopedStores };
}

export interface MountUseBrickResult {
  portal?: HTMLElement;
}

export function mountUseBrick(
  { renderRoot, rendererContext, scopedStores }: RenderUseBrickResult,
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

  for (const store of scopedStores) {
    store.handleAsyncAfterMount();
  }

  rendererContext.dispatchOnMount();
  rendererContext.initializeScrollIntoView();
  rendererContext.initializeMediaChange();
  rendererContext.initializeMessageDispatcher();

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

/** For v2 compatibility of `doTransform` from brick-kit. */
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

export function updateStoryboard(
  appId: string,
  storyboardPatch: Partial<Storyboard>
): void {
  const storyboard = _internalApiGetStoryboardInBootstrapData(appId)!;
  Object.assign(storyboard, {
    ...storyboardPatch,
    $$fulfilling: null,
    $$fulfilled: true,
    $$registerCustomTemplateProcessed: false,
  });
  registerAppI18n(storyboard);
}

export function updateStoryboardByRoute(appId: string, newRoute: RouteConf) {
  const storyboard = _internalApiGetStoryboardInBootstrapData(appId)!;
  let match = false;
  const getKey = (route: RouteConf): string => `${route.path}.${route.exact}`;
  const replaceRoute = (routes: RouteConf[], key: string): RouteConf[] => {
    return routes.map((route) => {
      const routeKey = getKey(route);
      if (route.type === "routes") {
        route.routes = replaceRoute(route.routes, key);
        return route;
      } else if (routeKey === key) {
        match = true;
        return newRoute;
      } else {
        return route;
      }
    });
  };
  storyboard.routes = replaceRoute(storyboard.routes, getKey(newRoute));
  if (!match) {
    storyboard.routes.unshift(newRoute);
  }
}

export function updateStoryboardByTemplate(
  appId: string,
  newTemplate: CustomTemplate,
  settings: unknown
): void {
  const tplName = `${appId}.${newTemplate.name}`;
  // customTemplateRegistry.delete(tplName);
  customTemplates.define(tplName, {
    bricks: newTemplate.bricks,
    proxy: newTemplate.proxy,
    state: newTemplate.state,
  });
  updateTemplatePreviewSettings(appId, newTemplate.name, settings);
}

export function updateTemplatePreviewSettings(
  appId: string,
  templateId: string,
  settings?: unknown
): void {
  _updatePreviewSettings(
    appId,
    `\${APP.homepage}/_dev_only_/template-preview/${templateId}`,
    [
      {
        brick: templateId,
        ...pick(settings, "properties", "events", "lifeCycle", "context"),
      },
    ]
  );
}

export function updateStoryboardBySnippet(
  appId: string,
  snippetData: {
    snippetId: string;
    bricks?: BrickConf[];
  }
): void {
  _updatePreviewSettings(
    appId,
    `\${APP.homepage}/_dev_only_/snippet-preview/${snippetData.snippetId}`,
    snippetData.bricks?.length ? snippetData.bricks : [{ brick: "span" }]
  );
}

export const updateSnippetPreviewSettings = updateStoryboardBySnippet;

function _updatePreviewSettings(
  appId: string,
  path: string,
  bricks: BrickConf[]
) {
  const { routes } = _internalApiGetStoryboardInBootstrapData(appId)!;
  const previewRouteIndex = routes.findIndex((route) => route.path === path);
  const newPreviewRoute: RouteConf = {
    path,
    bricks,
    menu: false,
    exact: true,
  };
  if (previewRouteIndex === -1) {
    routes.unshift(newPreviewRoute);
  } else {
    routes.splice(previewRouteIndex, 1, newPreviewRoute);
  }
}

export function getContextValue(
  name: string,
  { tplStateStoreId }: DataValueOption
): unknown {
  const runtimeContext = _internalApiGetRuntimeContext()!;

  if (tplStateStoreId) {
    const tplStateStore = getTplStateStore(
      {
        ...runtimeContext,
        tplStateStoreId,
      },
      "STATE"
    );
    return tplStateStore.getValue(name);
  }

  return runtimeContext.ctxStore.getValue(name);
}

export function getAllContextValues({
  tplStateStoreId,
}: DataValueOption): Record<string, unknown> {
  const runtimeContext = _internalApiGetRuntimeContext()!;

  if (tplStateStoreId) {
    const tplStateStore = getTplStateStore(
      {
        ...runtimeContext,
        tplStateStoreId,
      },
      "STATE"
    );
    return tplStateStore.getAllValues();
  }

  return runtimeContext.ctxStore.getAllValues();
}

export function getBrickPackagesById(id: string) {
  return getBrickPackages().find((pkg) =>
    pkg.id ? pkg.id === id : pkg.filePath.startsWith(id)
  );
}

export function getRenderId() {
  return _internalApiGetRenderId();
}
