import {
  lt,
  lte,
  gt,
  gte,
  get,
  isEqual,
  forEach,
  includes,
  isUndefined,
} from "lodash";
import { type CellStatusProps } from "./index.js";
export const compareFunMap: Record<string, any> = {
  $eq: isEqual,
  $lt: lt,
  $lte: lte,
  $gt: gt,
  $gte: gte,
  $ne: (value: any, fieldValue: any): boolean => !isEqual(value, fieldValue),
  $isEqual: isEqual,
  $notEqual: (value: any, fieldValue: any): boolean =>
    !isEqual(value, fieldValue),
  $in: includes,
  $nin: (value: any, fieldValue: any): boolean => !includes(value, fieldValue),
  $exists: (value: any, fieldValue: any): boolean =>
    value ? !isUndefined(fieldValue) : isUndefined(fieldValue),
};

export function getCellStyle(
  cellStatus: CellStatusProps,
  item: Record<string, any>,
  value?: any
): Record<string, string> {
  const { dataIndex, mapping: list } = cellStatus;
  const finalValue = dataIndex !== undefined ? get(item, dataIndex) : value;
  const ret = list.find((item) => item.value === finalValue);

  if (!ret) return {};

  return {
    borderLeft: `4px solid ${ret.leftBorderColor}`,
  };
}
export const getKeysOfData = (
  data: Record<string, any>[],
  rowKey: string,
  childrenColumnName: string,
  keys: string[]
): void => {
  if (data) {
    forEach(data, (item) => {
      const children = get(item, childrenColumnName);
      const key = get(item, rowKey);
      keys.push(key);
      if (children?.length) {
        getKeysOfData(children, rowKey, childrenColumnName, keys);
      }
    });
  }
};
export const getRowsOfData = (
  data: Record<string, any>[],
  childrenColumnName: string,
  rows: Record<string, any>[]
): void => {
  if (data) {
    forEach(data, (item) => {
      const children = get(item, childrenColumnName);
      rows.push(item);
      if (children?.length) {
        getRowsOfData(children, childrenColumnName, rows);
      }
    });
  }
};

export function stripEmptyExpandableChildrenByName(
  name: string,
  data: Record<string, any>[] = []
): Record<string, any>[] {
  if (data?.length) {
    data.forEach((value) => {
      if (value[name]?.length) {
        return stripEmptyExpandableChildrenByName(name, value[name]);
      }

      delete value[name];
      return value;
    });
  }
  return data;
}
