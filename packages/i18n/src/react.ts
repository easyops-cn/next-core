import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { initializeI18n } from "@next-core/i18n/basic";

let initialized = false;

export function initializeReactI18n() {
  if (initialized) {
    return;
  }
  initialized = true;
  initializeI18n();
  initReactI18next.init(i18next.default);
}
