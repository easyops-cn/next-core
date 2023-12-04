import { getAllContextValues } from "../secret_internals.js";

export interface RealTimeDataInspectRoot {
  tplStateStoreId?: string;
}

export type RealTimeDataInspectHook = (
  detail: RealTimeDataInspectDetail
) => void;

export type RealTimeDataInspectDetail =
  | RealTimeDataInspectUpdateDetail
  | RealTimeDataInspectInitializeDetail;

export interface RealTimeDataInspectUpdateDetail {
  changeType: "update";
  tplStateStoreId?: string;
  detail: {
    name: string;
    value: unknown;
  };
}

export interface RealTimeDataInspectInitializeDetail {
  changeType: "initialize";
  tplStateStoreId?: string;
  detail: {
    data: Record<string, unknown>;
  };
}

export let realTimeDataInspectRoot: RealTimeDataInspectRoot | undefined;

export const RealTimeDataInspectHooks: RealTimeDataInspectHook[] = [];

export function setRealTimeDataInspectRoot(root: RealTimeDataInspectRoot) {
  realTimeDataInspectRoot = root;

  const data = getAllContextValues({ tplStateStoreId: root.tplStateStoreId });
  callRealTimeDataInspectHooks({
    changeType: "initialize",
    tplStateStoreId: root.tplStateStoreId,
    detail: { data },
  });
}

export function addRealTimeDataInspectHook(hook: RealTimeDataInspectHook) {
  RealTimeDataInspectHooks.push(hook);
}

export function callRealTimeDataInspectHooks(
  detail: RealTimeDataInspectDetail
) {
  setTimeout(() => {
    for (const hook of RealTimeDataInspectHooks) {
      try {
        hook(detail);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          `RealTimeDataInspectHook failed (${detail.changeType}):`,
          error
        );
      }
    }
  });
}
