import { formatValue } from "./func/valueFormatter";

export function unitFormat(
  value: number,
  unit: string,
  precision = 2
): [string, string] {
  return formatValue(value, { unit, precision });
}
