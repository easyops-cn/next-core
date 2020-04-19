import {
  BytesUnitId as DataFormatUnitId,
  Unit as FormatUnit,
  bytes,
  bibytes,
  deprecatedBytes,
} from "../constants";

export const dataFormatUnits: FormatUnit[][] = [
  bytes,
  bibytes,
  // deprecated
  deprecatedBytes,
];

export const dataFormatUnitIds = ([] as string[]).concat.apply(
  [],
  dataFormatUnits.map((dataFormatUnitGroup) => [
    ...dataFormatUnitGroup.map((dataFormatUnit) => dataFormatUnit.id),
    ...([] as string[]).concat.apply(
      [],
      dataFormatUnitGroup.map((dataFormatUnit) =>
        dataFormatUnit.alias ? dataFormatUnit.alias : []
      )
    ),
  ])
);

export function humanizeDataValue(
  value: number,
  unit?: DataFormatUnitId
): [number, string] {
  let baseDataUnitGroupIndex = dataFormatUnits.length - 1;
  let baseDataUnitIndex = 0;

  if (unit) {
    for (let i = 0; i < dataFormatUnits.length; ++i) {
      const dataUnitIndex = dataFormatUnits[i].findIndex(
        (dataUnit) =>
          dataUnit.id.toLocaleLowerCase() === unit.toLocaleLowerCase() ||
          (dataUnit.alias &&
            dataUnit.alias
              .map((alias) => alias.toLocaleLowerCase())
              .includes(unit))
      );
      // istanbul ignore else
      if (dataUnitIndex !== -1) {
        baseDataUnitGroupIndex = i;
        baseDataUnitIndex = dataUnitIndex;
        break;
      }
    }
  }
  const dataFormatUnitGroup = dataFormatUnits[baseDataUnitGroupIndex];

  let dataFormatUnit = dataFormatUnitGroup[baseDataUnitIndex];
  for (let i = baseDataUnitIndex + 1; i < dataFormatUnitGroup.length; ++i) {
    if (
      value /
        (dataFormatUnitGroup[i].divisor /
          dataFormatUnitGroup[baseDataUnitIndex].divisor) >=
      1
    ) {
      dataFormatUnit = dataFormatUnitGroup[i];
    } else {
      break;
    }
  }

  return [
    value /
      (dataFormatUnit.divisor / dataFormatUnitGroup[baseDataUnitIndex].divisor),
    dataFormatUnit.display,
  ];
}
