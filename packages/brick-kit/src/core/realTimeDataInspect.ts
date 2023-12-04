import type { StoryboardContextItemFreeVariable } from "@next-core/brick-types/src/runtime.js";
import { _dev_only_getAllContextValues } from "./Runtime";

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

export function setRealTimeDataInspectRoot(
  root: RealTimeDataInspectRoot
): void {
  realTimeDataInspectRoot = root;

  const data = Object.fromEntries(
    [..._dev_only_getAllContextValues({ tplContextId: root.tplStateStoreId })]
      .filter(([, item]) => item.type === "free-variable")
      .map(([k, item]) => [
        k,
        (item as StoryboardContextItemFreeVariable).value,
      ])
  );
  callRealTimeDataInspectHooks({
    changeType: "initialize",
    tplStateStoreId: root.tplStateStoreId,
    detail: { data },
  });
}

export function addRealTimeDataInspectHook(
  hook: RealTimeDataInspectHook
): void {
  RealTimeDataInspectHooks.push(hook);
}

export function callRealTimeDataInspectHooks(
  detail: RealTimeDataInspectDetail
): void {
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
