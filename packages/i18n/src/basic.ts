import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

let initialized = false;

export function initializeI18n() {
  if (initialized) {
    return;
  }
  initialized = true;
  i18next
    // learn more: https://github.com/i18next/i18next-xhr-backend
    // .use(Backend)
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector.default)
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
      fallbackLng: "zh",
      /*global process*/
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
      resources: {
        en: {
          translation: {
            hello: "Hello",
          },
        },
        zh: {
          translation: {
            hello: "你好",
          },
        },
      },
    });
}
