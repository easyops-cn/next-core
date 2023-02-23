import { i18n } from "@next-core/i18n";
import { hasOwnProperty } from "@next-core/utils/general";
import { I18nData } from "@next-core/types";

export function i18nText(
  data: I18nData | null | undefined
): string | undefined {
  if (!data) {
    return;
  }
  const language = i18n.language ?? "zh-CN";
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
