import { i18n } from "@next-core/i18n";
import { RuntimeStoryboard } from "@next-core/types";

export function registerAppI18n(storyboard: RuntimeStoryboard) {
  if (storyboard.meta?.i18n) {
    // Prefix to avoid conflict between brick package's i18n namespace.
    const i18nNamespace = getI18nNamespace("app", storyboard.app.id);
    // Support any language in `meta.i18n`.
    Object.entries(storyboard.meta.i18n).forEach(([lang, resources]) => {
      i18n.addResourceBundle(lang, i18nNamespace, resources);
    });
  }
}

export function getI18nNamespace(
  type: "app" | "widget" | "menu",
  id: string
): string {
  return `$${type}-${id}`;
}
