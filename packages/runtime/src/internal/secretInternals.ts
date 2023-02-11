import type { BrickConf, UseSingleBrickConf } from "@next-core/brick-types";
import { flushStableLoadBricks } from "@next-core/loader";
import { _internalApiGetRuntimeContext } from "./Runtime.js";
import { renderBrick } from "./Renderer.js";
import { RendererContext } from "./RendererContext.js";
import type { DataStore } from "./data/DataStore.js";
import type { RuntimeBrick } from "./interfaces.js";
import { BrickNode } from "./BrickNode.js";
import { afterMountTree, mountTree, unmountTree } from "./mount.js";

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

  const output = await renderBrick(
    useBrick as BrickConf,
    runtimeContext,
    new RendererContext("useBrick")
  );

  output.blockingList.push(
    ...[...runtimeContext.tplStateStoreMap.values()].map((store) =>
      store.waitForAll()
    ),
    ...runtimeContext.pendingPermissionsPreCheck
  );

  flushStableLoadBricks();

  await Promise.all(output.blockingList);

  return output;
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
    const portalRoot = document.querySelector(
      "#portal-mount-point"
    ) as HTMLElement;
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

export function unmountUseBrick(
  prevMountResult: MountUseBrickResult | undefined
): void {
  if (!prevMountResult) {
    return;
  }
  if (prevMountResult.mainBrickNode) {
    prevMountResult.mainBrickNode.unmount();
  }
  if (prevMountResult.portalMountPoint) {
    unmountTree(prevMountResult.portalMountPoint);
  }
}
