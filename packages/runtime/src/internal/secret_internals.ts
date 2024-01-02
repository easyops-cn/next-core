import type {
  BrickConf,
  CustomTemplate,
  RouteConf,
  Storyboard,
  UseSingleBrickConf,
  RuntimeSnippet,
  ContextConf,
} from "@next-core/types";
import { pick } from "lodash";
import {
  _internalApiGetRenderId,
  _internalApiGetRuntimeContext,
  _internalApiGetStoryboardInBootstrapData,
  getBrickPackages,
} from "./Runtime.js";
import {
  createScopedRuntimeContext,
  postAsyncRender,
  renderBrick,
} from "./Renderer.js";
import { RendererContext } from "./RendererContext.js";
import type { DataStore } from "./data/DataStore.js";
import type {
  DataValueOption,
  PreviewOption,
  PreviewStoryboardPatch,
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

export type { DataValueOption, RuntimeContext };

export const symbolForRootRuntimeContext = Symbol.for("root.runtimeContext");

export interface RuntimeUseBrickConfWithRootSymbols extends UseSingleBrickConf {
  [symbolForRootRuntimeContext]?: RuntimeContext;
}

export interface RenderUseBrickResult {
  tagName: string | null;
  renderRoot: RenderRoot;
  rendererContext: RendererContext;
  scopedStores: DataStore<"STATE" | "FORM_STATE">[];
}

export async function renderUseBrick(
  useBrick: RuntimeUseBrickConfWithRootSymbols,
  data: unknown
): Promise<RenderUseBrickResult> {
  const [scopedRuntimeContext, tplStateStoreScope, formStateStoreScope] =
    createScopedRuntimeContext({
      ...(useBrick[symbolForRootRuntimeContext] ??
        _internalApiGetRuntimeContext()!),
      data,
      pendingPermissionsPreCheck: [],
    });

  scopedRuntimeContext.tplStateStoreMap ??= new Map();
  scopedRuntimeContext.formStateStoreMap ??= new Map();

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
    scopedRuntimeContext,
    rendererContext,
    []
  );

  const scopedStores = [...tplStateStoreScope, ...formStateStoreScope];

  await postAsyncRender(output, scopedRuntimeContext, scopedStores);

  if (output.node?.tag === RenderTag.PLACEHOLDER) {
    throw new Error(
      "The root brick of useBrick cannot be an ignored control node"
    );
  }

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

  rendererContext.dispatchOnMount();
  rendererContext.initializeScrollIntoView();
  rendererContext.initializeMediaChange();
  rendererContext.initializeMessageDispatcher();

  for (const store of scopedStores) {
    store.mountAsyncData();
  }

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
    meta: {
      // Keep runtime fields such as `injectMenus`
      ...storyboard.meta,
      ...storyboardPatch.meta,
    },
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
        ...pick(
          settings,
          "properties",
          "events",
          "lifeCycle",
          "context",
          "slots",
          "children"
        ),
      },
    ]
  );
}

function getSnippetPreviewPath(snippetId: string): string {
  return `\${APP.homepage}/_dev_only_/snippet-preview/${snippetId}`;
}

export function updateStoryboardBySnippet(
  appId: string,
  snippetData: {
    snippetId: string;
    bricks?: BrickConf[];
    context?: ContextConf[];
  }
): void {
  _updatePreviewSettings(
    appId,
    getSnippetPreviewPath(snippetData.snippetId),
    snippetData.bricks?.length ? snippetData.bricks : [{ brick: "span" }],
    snippetData.context
  );
}

export const updateSnippetPreviewSettings = updateStoryboardBySnippet;

function _updatePreviewSettings(
  appId: string,
  path: string,
  bricks: BrickConf[],
  context?: ContextConf[]
) {
  const { routes } = _internalApiGetStoryboardInBootstrapData(appId)!;
  const previewRouteIndex = routes.findIndex((route) => route.path === path);
  const newPreviewRoute: RouteConf = {
    path,
    bricks,
    context,
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

export async function getAddedContracts(
  storyboardPatch: PreviewStoryboardPatch,
  { appId, updateStoryboardType, collectUsedContracts }: PreviewOption
): Promise<string[]> {
  const storyboard = _internalApiGetStoryboardInBootstrapData(appId);
  let updatedStoryboard;

  // 拿到更新部分的 storyboard 配置，然后扫描一遍，找到新增的 contracts
  if (updateStoryboardType === "route") {
    updatedStoryboard = {
      routes: [storyboardPatch as RouteConf],
    } as Storyboard;
  } else if (updateStoryboardType === "template") {
    updatedStoryboard = {
      meta: {
        customTemplates: [storyboardPatch as CustomTemplate],
      },
    } as Storyboard;
  } else if (updateStoryboardType === "snippet") {
    // snippet 是放在挂载 route 里预览，通过 previewPath 拿到当前修改 route
    const snippetPreviewPath = getSnippetPreviewPath(
      (storyboardPatch as RuntimeSnippet).snippetId
    );
    const currentRoute = storyboard?.routes?.find(
      (route) => route.path === snippetPreviewPath
    );

    updatedStoryboard = {
      routes: [currentRoute],
    } as Storyboard;
  }

  const addedContracts: string[] = [];

  if (updatedStoryboard && collectUsedContracts) {
    const contractApis = await collectUsedContracts(updatedStoryboard);

    contractApis.forEach((api: string) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, namespaceId, name] = api.match(
        /(.*)@(.*):\d\.\d\.\d/
      ) as string[];

      if (
        !storyboard?.meta?.contracts?.some(
          (contract) =>
            contract.namespaceId === namespaceId && contract.name === name
        )
      ) {
        addedContracts.push(api);
      }
    });
  }

  return addedContracts;
}

export {
  setRealTimeDataInspectRoot,
  addRealTimeDataInspectHook,
} from "./data/realTimeDataInspect.js";
