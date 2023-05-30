import type {
  RuntimeContext,
  RuntimeHelpers,
  RuntimeMenuItemRawData,
  RuntimeMenuRawData,
} from "./interfaces.js";
import {
  symbolAppId,
  symbolMenuI18nNamespace,
  symbolOverrideApp,
} from "./constants.js";

type RuntimeMenuRestRawData = Omit<RuntimeMenuRawData, "app" | "items">;
type RuntimeMenuItemRestRawData = Omit<RuntimeMenuItemRawData, "children">;

export function computeMenuData<
  T extends RuntimeMenuRestRawData | RuntimeMenuItemRestRawData
>(
  data: T,
  overrideAppId: string,
  runtimeContext: RuntimeContext,
  helpers: RuntimeHelpers
): Promise<T> {
  let newRuntimeContext = runtimeContext;
  if (overrideAppId !== runtimeContext.app.id) {
    const overrideApp = window.STANDALONE_MICRO_APPS
      ? data[symbolOverrideApp]
      : helpers.getStoryboardByAppId(overrideAppId)?.app;
    newRuntimeContext = {
      ...runtimeContext,
      overrideApp,
      appendI18nNamespace: data[symbolMenuI18nNamespace],
    };
  }
  return helpers.asyncComputeRealValue(data, newRuntimeContext, {
    ignoreSymbols: true,
  }) as Promise<T>;
}

export function computeMenuItems(
  items: RuntimeMenuItemRawData[],
  runtimeContext: RuntimeContext,
  helpers: RuntimeHelpers
): Promise<RuntimeMenuItemRawData[]> {
  return Promise.all(
    items.map(async ({ children, ...rest }) => {
      const [computedRest, computedChildren] = await Promise.all([
        computeMenuData(rest, rest[symbolAppId], runtimeContext, helpers),
        children && (await computeMenuItems(children, runtimeContext, helpers)),
      ]);
      return {
        ...computedRest,
        children: computedChildren,
      };
    })
  );
}