import { isEvaluable } from "./cook";
import { scanI18NInAny } from "./scanI18NInStoryboard";

/**
 * Get smart display for a string property, which may be an evaluation.
 *
 * E.g., for a button brick, display it by
 * `smartDisplayForEvaluableString(btn.$$parsedProperties.buttonName, btn.alias)`.
 *
 * @param rawString - Raw string value.
 * @param evaluationFallback - Fallback string if it's a un-parsable evaluation.
 *
 * @returns
 * Returns the I18N default value (or key if no value found)
 * if it contains one and only one I18N key.
 *
 * Or returns the fallback if it is an evaluation string and fallback presents.
 *
 * Or returns the raw string otherwise.
 */
export function smartDisplayForEvaluableString(
  rawString: string,
  evaluationFallback?: string
): string {
  if (typeof rawString === "string" && isEvaluable(rawString)) {
    const i18nData = scanI18NInAny(rawString);
    if (i18nData.size === 1) {
      const key = i18nData.keys().next().value;
      const valueSet = i18nData.get(key);
      return valueSet.size > 0 ? valueSet.values().next().value : key;
    }
    // Catch on `undefined` or `null`.
    if (evaluationFallback != undefined) {
      return evaluationFallback;
    }
  }
  return rawString;
}
