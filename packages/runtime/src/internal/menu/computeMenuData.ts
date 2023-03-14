import { asyncComputeRealValue } from "../compute/computeRealValue.js";
import type { RuntimeContext } from "../interfaces.js";
import type {
  RuntimeMenuItemRawData,
  RuntimeMenuRawData,
} from "./interfaces.js";
import { _internalApiGetAppInBootstrapData } from "../Runtime.js";
import {
  symbolAppId,
  symbolMenuI18nNamespace,
  symbolOverrideApp,
} from "./constants.js";

type RuntimeMenuRestRawData = Omit<RuntimeMenuRawData, "app" | "items">;
type RuntimeMenuItemRestRawData = Omit<RuntimeMenuItemRawData, "children">;

export function computeMenuData<
  T extends RuntimeMenuRestRawData | RuntimeMenuItemRestRawData
>(data: T, overrideAppId: string, runtimeContext: RuntimeContext): Promise<T> {
  let newRuntimeContext = runtimeContext;
  if (overrideAppId !== runtimeContext.app.id) {
    const overrideApp = window.STANDALONE_MICRO_APPS
      ? data[symbolOverrideApp]
      : _internalApiGetAppInBootstrapData(overrideAppId);
    newRuntimeContext = {
      ...runtimeContext,
      overrideApp,
      appendI18nNamespace: data[symbolMenuI18nNamespace],
    };
  }
  return asyncComputeRealValue(data, newRuntimeContext, {
    ignoreSymbols: true,
  }) as Promise<T>;
}

export function computeMenuItems(
  items: RuntimeMenuItemRawData[],
  runtimeContext: RuntimeContext
): Promise<RuntimeMenuItemRawData[]> {
  return Promise.all(
    items.map(async ({ children, ...rest }) => {
      const [computedRest, computedChildren] = await Promise.all([
        computeMenuData(rest, rest[symbolAppId], runtimeContext),
        children && (await computeMenuItems(children, runtimeContext)),
      ]);
      return {
        ...computedRest,
        children: computedChildren,
      };
    })
  );
}
