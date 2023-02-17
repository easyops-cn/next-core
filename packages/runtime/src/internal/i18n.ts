import i18n from "i18next";
// import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

export function initI18n() {
  i18n
    // learn more: https://github.com/i18next/i18next-xhr-backend
    // .use(Backend)
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // .use(initReactI18next)
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
