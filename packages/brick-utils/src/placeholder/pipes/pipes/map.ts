import { get } from "lodash";

export function map(value: unknown, key: string): unknown[] {
  return Array.isArray(value) ? value.map((item) => get(item, key)) : [];
}
