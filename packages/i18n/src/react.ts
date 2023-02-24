import { i18n } from "@next-core/i18n";
import { initReactI18next, useTranslation } from "react-i18next";
import { initializeI18n } from "@next-core/i18n";

let initialized = false;

export function initializeReactI18n() {
  if (initialized) {
    return;
  }
  initialized = true;
  initializeI18n();
  initReactI18next.init(i18n);
}

export { useTranslation };
