import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import moment from "moment";
import LanguageDetector from "i18next-browser-languagedetector";
import { initI18n } from "@easyops/brick-kit";

import { NS_BRICK_CONTAINER } from "./constants";
import en from "./locales/en";
import zh from "./locales/zh";

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
    // whitelist: ["en", "zh"],

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    react: {
      useSuspense: false,
    },
  });

initI18n();

i18n.addResourceBundle("en", NS_BRICK_CONTAINER, en);
i18n.addResourceBundle("zh", NS_BRICK_CONTAINER, zh);

i18n.on("languageChanged", function (lng) {
  moment.locale(lng);
});

export default i18n;
