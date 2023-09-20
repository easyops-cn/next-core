import { i18n } from "@next-core/i18n";
import type { MetaI18n } from "@next-core/types";
import { getI18nNamespace } from "../registerAppI18n.js";
import { getV2RuntimeFromDll } from "../../getV2RuntimeFromDll.js";

function registerWidgetI18nV3(widgetId: string, i18nData: MetaI18n): void {
  const ns = getI18nNamespace("widget", widgetId);
  Object.entries(i18nData).forEach(([lang, resources]) => {
    i18n.addResourceBundle(lang, ns, resources);
  });
}

export function widgetI18nFactory(widgetId: string) {
  return i18n.getFixedT(null, getI18nNamespace("widget", widgetId));
}

// istanbul ignore next
function registerWidgetI18nV2Factory() {
  const v2Kit = getV2RuntimeFromDll();
  if (v2Kit) {
    return v2Kit.registerWidgetI18n;
  }
}

// istanbul ignore next
export const registerWidgetI18n =
  registerWidgetI18nV2Factory() || registerWidgetI18nV3;
