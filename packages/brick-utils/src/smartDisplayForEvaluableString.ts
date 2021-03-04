import { isEvaluable } from "./cook";
import { scanI18NInAny } from "./scanI18NInStoryboard";

/**
 * Get smart display for a string property, which may be an evaluation.
 *
 * This is useful for brick editors to display specific property configurations.
 *
 * E.g., for a button brick editor, display it by
 * `smartDisplayForEvaluableString(btn.$$parsedProperties.buttonName, btn.alias, "<% … %>")`.
 *
 * @param rawString - Raw string value.
 * @param nonStringFallback - Fallback value if it's not a string.
 * @param unknownEvaluationFallback - Fallback value if it's an unknown evaluation.
 *
 * @returns
 *
 * Returns the nonStringFallback if the input is not a string and nonStringFallback presents.
 *
 * Or returns the raw input when nonStringFallback no presents.
 *
 * Returns the I18N default value (or key if no value found)
 * if it is an evaluation and contains one and only one I18N key.
 *
 * Or returns the unknownEvaluationFallback if it is an unknown evaluation string and
 * unknownEvaluationFallback presents.
 *
 * Or returns the raw input otherwise.
 */
export function smartDisplayForEvaluableString<T, U, V>(
  rawString: T,
  nonStringFallback?: U,
  unknownEvaluationFallback?: V
): T | U | V | string {
  if (typeof rawString !== "string") {
    // Catch on `undefined` or `null`.
    if (nonStringFallback != undefined) {
      return nonStringFallback;
    }
    return rawString;
  }
  if (isEvaluable(rawString)) {
    const i18nData = scanI18NInAny(rawString);
    if (i18nData.size === 1) {
      const key = i18nData.keys().next().value as string;
      const valueSet = i18nData.get(key);
      return valueSet.size > 0
        ? (valueSet.values().next().value as string)
        : key;
    }
    // Catch on `undefined` or `null`.
    if (unknownEvaluationFallback != undefined) {
      return unknownEvaluationFallback;
    }
  }
  return rawString;
}
