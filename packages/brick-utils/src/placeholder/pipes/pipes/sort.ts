import { sortBy } from "lodash";

export function sort<T>(value: T[], fields?: string | string[]): T[] {
  return Array.isArray(value) ? sortBy(value, fields) : [];
}
