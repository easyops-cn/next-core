import {
  ByteRatesUnitId as DataRateFormatUnitId,
  Unit as FormatUnit,
  bitRates,
  byteRates,
  deprecatedByteRates,
} from "../constants";

export const dataRateFormatUnits: FormatUnit[][] = [
  bitRates,
  byteRates,
  // deprecated
  deprecatedByteRates,
];

export const dataRateFormatUnitIds = ([] as string[]).concat.apply(
  [],
  dataRateFormatUnits.map((dataRateFormatUnitGroup) => [
    ...dataRateFormatUnitGroup.map(
      (dataRateFormatUnit) => dataRateFormatUnit.id
    ),
    ...([] as string[]).concat.apply(
      [],
      dataRateFormatUnitGroup.map((dataRateFormatUnit) =>
        dataRateFormatUnit.alias ? dataRateFormatUnit.alias : []
      )
    ),
  ])
);

export function humanizeDataRateValue(
  value: number,
  unit?: DataRateFormatUnitId
): [number, string] {
  let baseDataRateUnitGroupIndex = dataRateFormatUnits.length - 1;
  let baseDataRateUnitIndex = 0;

  if (unit) {
    for (let i = 0; i < dataRateFormatUnits.length; ++i) {
      const dataRateUnitIndex = dataRateFormatUnits[i].findIndex(
        (dataRateUnit) =>
          dataRateUnit.id.toLocaleLowerCase() === unit.toLocaleLowerCase() ||
          (dataRateUnit.alias &&
            dataRateUnit.alias
              .map((alias) => alias.toLocaleLowerCase())
              .includes(unit))
      );
      if (dataRateUnitIndex !== -1) {
        baseDataRateUnitGroupIndex = i;
        baseDataRateUnitIndex = dataRateUnitIndex;
        break;
      }
    }
  }
  const dataRateFormatUnitGroup =
    dataRateFormatUnits[baseDataRateUnitGroupIndex];

  let dataRateFormatUnit = dataRateFormatUnitGroup[baseDataRateUnitIndex];
  for (
    let i = baseDataRateUnitIndex + 1;
    i < dataRateFormatUnitGroup.length;
    ++i
  ) {
    if (
      value /
        (dataRateFormatUnitGroup[i].divisor /
          dataRateFormatUnitGroup[baseDataRateUnitIndex].divisor) >=
      1
    ) {
      dataRateFormatUnit = dataRateFormatUnitGroup[i];
    } else {
      break;
    }
  }

  return [
    value /
      (dataRateFormatUnit.divisor /
        dataRateFormatUnitGroup[baseDataRateUnitIndex].divisor),
    dataRateFormatUnit.display,
  ];
}
