import type {
  BootstrapData,
  BrickConf,
  CustomTemplate,
  RouteConf,
  SiteTheme,
  Storyboard,
  UseSingleBrickConf,
} from "@next-core/types";
import {
  flushStableLoadBricks,
  loadBricksImperatively,
} from "@next-core/loader";
import { pick } from "lodash";
import {
  _internalApiGetRuntimeContext,
  _internalApiGetStoryboardInBootstrapData,
  _internalApiSetBootstrapData,
  getBrickPackages,
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
import { isStrictMode, warnAboutStrictMode } from "../isStrictMode.js";
import { customTemplates } from "../CustomTemplates.js";
import { registerAppI18n } from "./registerAppI18n.js";

export interface RenderUseBrickResult {
  tagName: string | null;
  renderRoot: RenderRoot;
  rendererContext: RendererContext;
}

export async function renderUseBrick(
  useBrick: UseSingleBrickConf,
  data: unknown
): Promise<RenderUseBrickResult> {
  const tplStateStoreScope: DataStore<"STATE">[] = [];
  const runtimeContext: RuntimeContext = {
    ..._internalApiGetRuntimeContext()!,
    data,
    pendingPermissionsPreCheck: [],
    tplStateStoreScope,
  };

  runtimeContext.tplStateStoreMap ??= new Map();

  const rendererContext = new RendererContext("useBrick");

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

  await Promise.all([
    ...output.blockingList,
    // Wait for local tpl state stores belong to current `useBrick` only.
    ...tplStateStoreScope.map((store) => store.waitForAll()),
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
  options: {
    sandbox?: boolean;
    theme?: SiteTheme;
  } = {}
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

  if (options.sandbox) {
    setTheme(options.theme ?? "light");
    setMode("default");

    if (!failed) {
      rendererContext.dispatchBeforePageLoad();
    }

    applyTheme();
    applyMode();
  }

  mountTree(renderRoot);

  if (options.sandbox) {
    window.scrollTo(0, 0);
  }

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

// istanbul ignore next
export function loadBricks(bricks: string[] | Set<string>) {
  return loadBricksImperatively(bricks, getBrickPackages());
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