import { i18n } from "@next-core/i18n";
import LanguageDetector from "i18next-browser-languagedetector";

let initialized = false;
const initializedNamespaces = new Set<string>();

export type Locales = Record<string, Record<string, string>>;

export function initializeI18n(): void;
export function initializeI18n(NS: string, locales: Locales): void;
export function initializeI18n(NS?: string, locales?: Locales) {
  if (!initialized) {
    initialized = true;
    i18n
      // learn more: https://github.com/i18next/i18next-xhr-backend
      // .use(Backend)
      // learn more: https://github.com/i18next/i18next-browser-languageDetector
      .use(
        process.env.NODE_ENV === "test"
          ? (LanguageDetector as unknown as LanguageDetector.default)
          : /* istanbul ignore next */ LanguageDetector.default
      )
      // for all options read: https://www.i18next.com/overview/configuration-options
      .init({
        fallbackLng: "zh",
        debug: process.env.NODE_ENV === "development",
        supportedLngs: ["zh", "en"],
        nonExplicitSupportedLngs: true,
        interpolation: {
          escapeValue: false, // not needed for react as it escapes by default
        },
        react: {
          useSuspense: false,
        },
        compatibilityJSON: "v3",
        resources: {},
      });
  }

  if (!NS || !locales || initializedNamespaces.has(NS)) {
    return;
  }
  initializedNamespaces.add(NS);
  for (const [lang, resources] of Object.entries(locales)) {
    i18n.addResourceBundle(lang, NS, resources);
  }
}
