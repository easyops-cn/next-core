import { toPairs, zipObject } from "lodash";

export function mapToArray(
  value: unknown,
  keyField: string,
  valueField: string
): unknown[] {
  if (typeof value !== "object" || !value) return [];
  const fields = [keyField, valueField];
  const pairs = toPairs(value);
  return pairs.map((pair) => zipObject(fields, pair));
}
