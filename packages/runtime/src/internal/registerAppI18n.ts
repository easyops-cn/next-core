import { i18n } from "@next-core/i18n";
import { Storyboard } from "@next-core/types";

export function registerAppI18n({ app, meta }: Storyboard) {
  if (meta?.i18n) {
    // Prefix to avoid conflict between brick package's i18n namespace.
    const i18nNamespace = getI18nNamespace("app", app.id);
    // Support any language in `meta.i18n`.
    const languages: string[] = [];
    Object.entries(meta.i18n).forEach(([lang, resources]) => {
      i18n.addResourceBundle(lang, i18nNamespace, resources);
      languages.push(lang);
    });
    return () => {
      for (const lang of languages) {
        i18n.removeResourceBundle(lang, i18nNamespace);
      }
    };
  }
}

export function getI18nNamespace(
  type: "app" | "widget" | "menu",
  id: string
): string {
  return `${type}/${id}`;
}
