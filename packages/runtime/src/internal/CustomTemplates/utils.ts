import { RuntimeBrickElement } from "@next-core/brick-types";
import type { DataStore } from "../data/DataStore.js";
import type { RuntimeContext } from "../interfaces.js";
import { customTemplates } from "../../CustomTemplates.js";

export function getTplStateStore(
  { tplStateStoreId, tplStateStoreMap }: RuntimeContext,
  using: string,
  extraInfo?: string
): DataStore<"STATE"> {
  if (!tplStateStoreId) {
    throw new Error(
      `Using "${using}" outside of a custom template${extraInfo ?? ""}`
    );
  }
  const store = tplStateStoreMap.get(tplStateStoreId);
  if (!store) {
    throw new Error(
      `Template state store is not found when using "${using}"${
        extraInfo ?? ""
      }.\nThis is a bug of Brick Next, please report it.`
    );
  }
  return store!;
}

export function getTplHostElement(
  runtimeContext: RuntimeContext,
  using: string,
  extraInfo?: string
): RuntimeBrickElement {
  const store = getTplStateStore(runtimeContext, using, extraInfo);
  const hostElement = store.hostBrick!.element;
  if (!hostElement) {
    throw new Error(
      `Template host element is gone when using "${using}"${
        extraInfo ?? ""
      }.\nThis is a bug of Brick Next, please report it.`
    );
  }
  return hostElement!;
}

export function getTagNameOfCustomTemplate(
  brick: string,
  appId?: string
): false | string {
  // When a template is registered by an app, it's namespace maybe missed.
  if (!brick.includes(".") && appId) {
    const tagName = `${appId}.${brick}`;
    if (customTemplates.get(tagName)) {
      return tagName;
    }
  }
  if (customTemplates.get(brick)) {
    return brick;
  }
  return false;
}
