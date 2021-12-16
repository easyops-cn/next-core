import i18next, { getFixedT, TFunction } from "i18next";
import { MetaI18n } from "@next-core/brick-types";
import { getI18nNamespace } from "../i18n";

export function registerWidgetI18n(widgetId: string, i18n: MetaI18n): void {
  const ns = getI18nNamespace("widget", widgetId);
  Object.entries(i18n).forEach(([lang, resources]) => {
    i18next.addResourceBundle(lang, ns, resources);
  });
}

export function widgetI18nFactory(widgetId: string): TFunction {
  return getFixedT(null, getI18nNamespace("widget", widgetId));
}
