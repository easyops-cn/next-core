import {
  TimesUnitId as TimeFormatUnitId,
  Unit as FormatUnit,
  times,
} from "../constants";

export const timeFormatUnits: FormatUnit[][] = [times];

export const timeFormatUnitIds = ([] as string[]).concat.apply(
  [],
  timeFormatUnits.map((timeFormatUnitGroup) => [
    ...timeFormatUnitGroup.map((timeFormatUnit) => timeFormatUnit.id),
    ...([] as string[]).concat.apply(
      [],
      timeFormatUnitGroup.map((timeFormatUnit) =>
        timeFormatUnit.alias ? timeFormatUnit.alias : []
      )
    ),
  ])
);

export function humanizeTimeValue(
  value: number,
  unit?: TimeFormatUnitId
): [number, string] {
  let baseTimeUnitGroupIndex = 0;
  let baseTimeUnitIndex = 2;
  if (unit) {
    for (let i = 0; i < timeFormatUnits.length; ++i) {
      const timeUnitIndex = timeFormatUnits[i].findIndex(
        (timeUnit) =>
          timeUnit.id.toLocaleLowerCase() === unit.toLocaleLowerCase() ||
          (timeUnit.alias &&
            timeUnit.alias
              .map((alias) => alias.toLocaleLowerCase())
              .includes(unit))
      );
      // istanbul ignore else
      if (timeUnitIndex !== -1) {
        baseTimeUnitGroupIndex = i;
        baseTimeUnitIndex = timeUnitIndex;
        break;
      }
    }
  }
  const timeFormatUnitGroup = timeFormatUnits[baseTimeUnitGroupIndex];

  let timeFormatUnit = timeFormatUnitGroup[baseTimeUnitIndex];
  for (let i = baseTimeUnitIndex + 1; i < timeFormatUnitGroup.length; ++i) {
    if (
      value /
        (timeFormatUnitGroup[i].divisor /
          timeFormatUnitGroup[baseTimeUnitIndex].divisor) >=
      1
    ) {
      timeFormatUnit = timeFormatUnitGroup[i];
    } else {
      break;
    }
  }

  return [
    value /
      (timeFormatUnit.divisor / timeFormatUnitGroup[baseTimeUnitIndex].divisor),
    timeFormatUnit.display,
  ];
}
