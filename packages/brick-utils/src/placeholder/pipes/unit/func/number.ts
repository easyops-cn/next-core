import { ShortUnitId, numberFormatUnits } from "../constants";

export const humanizeNumberValue = (
  value: number,
  unit?: ShortUnitId,
  precision?: number
): string => {
  let baseNumberUnitIndex = 0;

  if (unit) {
    const numberUnitIndex = numberFormatUnits.findIndex(
      (numberUnit) =>
        numberUnit.id.toLocaleLowerCase() === unit.toLocaleLowerCase()
    );
    if (numberUnitIndex !== -1) {
      baseNumberUnitIndex = numberUnitIndex;
    }
  }

  let numberFormatUnit = numberFormatUnits[baseNumberUnitIndex];
  for (let i = baseNumberUnitIndex + 1; i < numberFormatUnits.length; ++i) {
    if (
      value /
        (numberFormatUnits[i].divisor /
          numberFormatUnits[baseNumberUnitIndex].divisor) >=
      1
    ) {
      numberFormatUnit = numberFormatUnits[i];
    } else {
      break;
    }
  }

  if (numberFormatUnit.id === ShortUnitId.None) {
    return value.toFixed(precision ?? 2);
  } else {
    return (
      (
        value /
        (numberFormatUnit.divisor /
          numberFormatUnits[baseNumberUnitIndex].divisor)
      ).toFixed(precision ?? 2) + numberFormatUnit.display
    );
  }
};
