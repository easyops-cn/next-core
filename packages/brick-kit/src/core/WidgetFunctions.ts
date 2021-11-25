import i18next from "i18next";
import { MetaI18n, StoryboardFunction } from "@next-core/brick-types";
import {
  ReadonlyStoryboardFunctions,
  StoryboardFunctionRegistryFactory,
} from "./StoryboardFunctionRegistryFactory";
import { getI18nNamespace } from "../i18n";

const widgetFunctionRegistry = new Map<string, ReadonlyStoryboardFunctions>();

export const widgetFunctions = new Proxy(Object.freeze({}), {
  get(target, key) {
    return widgetFunctionRegistry.get(key as string);
  },
}) as Readonly<Record<string, ReadonlyStoryboardFunctions>>;

export function registerWidgetFunctions(
  widgetId: string,
  functions: StoryboardFunction[]
): void {
  if (widgetFunctionRegistry.has(widgetId)) {
    // eslint-disable-next-line no-console
    throw new Error(`Widget functions of "${widgetId}" already registered`);
  }
  const { storyboardFunctions, registerStoryboardFunctions } =
    StoryboardFunctionRegistryFactory({ widgetId });
  widgetFunctionRegistry.set(widgetId, storyboardFunctions);
  registerStoryboardFunctions(functions);
}

export function registerWidgetI18n(widgetId: string, i18n: MetaI18n): void {
  const ns = getI18nNamespace("widget", widgetId);
  Object.entries(i18n).forEach(([lang, resources]) => {
    i18next.addResourceBundle(lang, ns, resources);
  });
}
