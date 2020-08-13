import { PercentUnitId as PercentFormatUnitId } from "../constants";

export function humanizePercentValue(
  value: number,
  unit?: PercentFormatUnitId
): number {
  if (unit) {
    switch (unit.toLocaleLowerCase()) {
      case PercentFormatUnitId.Percent100.toLocaleLowerCase():
        return value;
      default:
        return value * 100;
    }
  } else {
    return value * 100;
  }
}
