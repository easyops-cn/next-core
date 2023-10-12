import { getBrickPackages } from "./internal/Runtime.js";
import { loadBricksImperatively } from "@next-core/loader";

export interface UIAdapterBrick extends HTMLElement {
  resolve(version: string): Promise<void>;
}

const UI_ADAPTER_LOAD_CSS_FROM_UI_VERSION = "basic.apply-ui-version";

export async function loadUIPatch(
  version: string,
  isAllowUIPatch = true
): Promise<void> {
  if (isAllowUIPatch) {
    try {
      await loadBricksImperatively(
        [UI_ADAPTER_LOAD_CSS_FROM_UI_VERSION],
        getBrickPackages()
      );
      const element = document.createElement(
        UI_ADAPTER_LOAD_CSS_FROM_UI_VERSION
      ) as UIAdapterBrick;

      return element.resolve(version);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.warn("Load ui-adapter failed:", error);
    }
  }
}
