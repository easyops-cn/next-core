import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import moment from "moment";
import LanguageDetector from "i18next-browser-languagedetector";
import { initI18n } from "@next-core/brick-kit";

import { NS_BRICK_CONTAINER } from "./constants";
import en from "./locales/en";
import zh from "./locales/zh";

// I18next is synchronously initialized now,
// so we listen on language change before initialization.
i18n.on("languageChanged", function (lng) {
  moment.locale(lng);
  document.documentElement.setAttribute("lang", lng);
});

i18n
  // learn more: https://github.com/i18next/i18next-xhr-backend
  // .use(Backend)
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  .use(initReactI18next)
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
        [NS_BRICK_CONTAINER]: en,
      },
      zh: {
        [NS_BRICK_CONTAINER]: zh,
      },
    },
  });

initI18n();

export default i18n;
