import { isNil, groupBy, keys, set, indexOf, get } from "lodash";

export function groupByToIndex(
  value: Record<string, unknown>[],
  groupField: string,
  targetField: string
): Record<string, unknown>[] {
  let result = value;
  if (!isNil(groupField) && !isNil(targetField)) {
    const groupByValue = groupBy(value, groupField);
    const allKeys = keys(groupByValue).sort();
    result = result.map((v) => {
      const item = { ...v };
      set(item, targetField, indexOf(allKeys, get(v, groupField)));
      return item;
    });
  }
  return result;
}
