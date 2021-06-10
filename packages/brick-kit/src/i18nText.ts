import i18next from "i18next";
import { hasOwnProperty } from "@next-core/brick-utils";

export interface I18nData {
  [language: string]: string;
}

export function i18nText(data: I18nData): string {
  if (!data) {
    return;
  }
  const language = i18next.language ?? "zh-CN";
  // First, make a perfect match.
  if (hasOwnProperty(data, language)) {
    return data[language];
  }
  // https://en.wikipedia.org/wiki/IETF_language_tag
  const primaryLanguage = language.split("-")[0];
  if (primaryLanguage !== language) {
    // Then, match the primary language (which omits other subtags).
    // E.g., match `zh` if the current language is `zh-CN`.
    return hasOwnProperty(data, primaryLanguage)
      ? data[primaryLanguage]
      : undefined;
  }
  // At last, match the first key which starts with the primary language,
  // if the current language contains primary subtag only.
  // E.g., match `zh-CN` if the current language is `zh`.
  const prefix = `${primaryLanguage}-`;
  for (const key of Object.keys(data)) {
    if (key.startsWith(prefix)) {
      return data[key];
    }
  }
}
