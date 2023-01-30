import i18next from "i18next";
import { initReactI18next } from "react-i18next";

const i18n = i18next as unknown as typeof i18next.default;

initReactI18next.init(i18n);
