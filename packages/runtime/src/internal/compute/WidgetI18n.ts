// import i18next, { getFixedT, TFunction } from "i18next";
import { i18n } from "@next-core/i18n";
import type { MetaI18n } from "@next-core/types";
import { getI18nNamespace } from "../registerAppI18n.js";

export function registerWidgetI18n(widgetId: string, i18nData: MetaI18n): void {
  const ns = getI18nNamespace("widget", widgetId);
  Object.entries(i18nData).forEach(([lang, resources]) => {
    i18n.addResourceBundle(lang, ns, resources);
  });
}

export function widgetI18nFactory(widgetId: string) {
  return i18n.getFixedT(null, getI18nNamespace("widget", widgetId));
}
