import { i18n, initializeI18n, Locales } from "@next-core/i18n";
import { initReactI18next, useTranslation } from "react-i18next";

let initialized = false;

export function initializeReactI18n(): void;
export function initializeReactI18n(NS: string, locales: Locales): void;
export function initializeReactI18n(NS?: string, locales?: Locales) {
  initializeI18n(NS as string, locales as Locales);
  if (!initialized) {
    initialized = true;
    initReactI18next.init(i18n);
  }
}

export { useTranslation };
