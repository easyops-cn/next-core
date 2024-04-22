import { MicroApp, Settings } from "@next-core/brick-types";
import i18next from "i18next";

export function setAppLocales(app: MicroApp): void {
  const locales = (app.config?.settings as Settings)?.locales ?? app.locales;

  if (locales) {
    // Prefix to avoid conflict between brick package's i18n namespace.
    const ns = `$tmp-${app.id}`;
    // Support any languages in `app.locales`.
    Object.entries(locales).forEach(([lang, resources]) => {
      i18next.addResourceBundle(lang, ns, resources);
    });
    // Use `app.name` as the fallback `app.localeName`.
    app.localeName = i18next.getFixedT(null, ns)("name", app.name);
    // Remove the temporary i18n resource bundles.
    Object.keys(locales).forEach((lang) => {
      i18next.removeResourceBundle(lang, ns);
    });
  } else {
    app.localeName = app.name;
  }
}
