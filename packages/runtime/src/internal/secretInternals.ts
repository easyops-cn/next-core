import type {
  BrickConf,
  BrickPackage,
  SiteTheme,
  UseSingleBrickConf,
} from "@next-core/types";
import { flushStableLoadBricks } from "@next-core/loader";
import { _internalApiGetRuntimeContext } from "./Runtime.js";
import { RenderOutput, renderBrick, renderBricks } from "./Renderer.js";
import { RendererContext } from "./RendererContext.js";
import type { DataStore } from "./data/DataStore.js";
import type { RuntimeBrick, RuntimeContext } from "./interfaces.js";
import { BrickNode } from "./BrickNode.js";
import { afterMountTree, mountTree, unmountTree } from "./mount.js";
import { httpErrorToString } from "../handleHttpError.js";
import { applyMode, applyTheme, setMode, setTheme } from "../themeAndMode.js";

export async function renderUseBrick(
  useBrick: UseSingleBrickConf,
  data?: unknown
) {
  const runtimeContext = {
    ..._internalApiGetRuntimeContext()!,
    data,
    pendingPermissionsPreCheck: [],
    tplStateStoreMap: new Map<string, DataStore<"STATE">>(),
  };

  const rendererContext = new RendererContext("useBrick");
  const output = await renderBrick(
    useBrick as BrickConf,
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

  if (output.main.length === 0 && output.portal.length > 0) {
    throw new Error("The root brick of useBrick cannot be a portal brick");
  }

  return { output, rendererContext };
}

export interface MountUseBrickResult {
  mainBrickNode: BrickNode | undefined;
  portalMountPoint: HTMLElement;
}

export function mountUseBrick(
  mainBrick: RuntimeBrick,
  element: HTMLElement,
  portalBricks: RuntimeBrick[],
  prevMountResult?: MountUseBrickResult
): MountUseBrickResult;

export function mountUseBrick(
  mainBrick: null,
  element: null,
  portalBricks: RuntimeBrick[],
  prevMountResult?: MountUseBrickResult
): MountUseBrickResult;

export function mountUseBrick(
  mainBrick: RuntimeBrick | null,
  element: HTMLElement | null,
  portalBricks: RuntimeBrick[],
  prevMountResult?: MountUseBrickResult
): MountUseBrickResult {
  if (prevMountResult?.mainBrickNode) {
    prevMountResult.mainBrickNode.unmount();
  }
  let portalMountPoint: HTMLElement;
  if (prevMountResult?.portalMountPoint) {
    unmountTree(prevMountResult.portalMountPoint);
    ({ portalMountPoint } = prevMountResult);
  } else {
    const portalRoot =
      document.querySelector("#portal-mount-point") ||
      (document.querySelector("#preview-portal") as HTMLElement);
    portalMountPoint = document.createElement("div");
    portalRoot.appendChild(portalMountPoint);
  }

  let mainBrickNode: BrickNode | undefined;
  if (mainBrick) {
    mainBrickNode = new BrickNode(mainBrick, element!);
    mainBrickNode.mount();
  }
  mountTree(portalBricks, portalMountPoint);

  mainBrickNode?.afterMount();
  afterMountTree(portalMountPoint);

  return {
    mainBrickNode,
    portalMountPoint,
  };
}

export function unmountUseBrick(mountResult: MountUseBrickResult): void {
  if (mountResult.mainBrickNode) {
    mountResult.mainBrickNode.unmount();
  }
  if (mountResult.portalMountPoint) {
    unmountTree(mountResult.portalMountPoint);
  }
}

let _rendererContext: RendererContext;

export async function renderPreviewBricks(
  bricks: BrickConf[],
  brickPackages: BrickPackage[],
  mountPoints: {
    main: HTMLElement;
    portal: HTMLElement;
  },
  options?: {
    theme?: SiteTheme;
  }
) {
  const runtimeContext = {
    brickPackages,
    pendingPermissionsPreCheck: [],
    tplStateStoreMap: new Map<string, DataStore<"STATE">>(),
  } as Partial<RuntimeContext> as RuntimeContext;

  const previousRendererContext = _rendererContext;
  const rendererContext = (_rendererContext = new RendererContext("router"));

  let failed = false;
  let output: RenderOutput;
  try {
    output = await renderBricks(bricks, runtimeContext, rendererContext);

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

  mountTree(output.main, mountPoints.main);
  mountTree(output.portal, mountPoints.portal);

  window.scrollTo(0, 0);

  if (!failed) {
    rendererContext.dispatchPageLoad();
    // rendererContext.dispatchAnchorLoad();
    rendererContext.initializeScrollIntoView();
    rendererContext.initializeMediaChange();
  }
}
