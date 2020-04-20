export enum ShortUnitId {
  None = "none",
  K = "K",
  M = "M",
  B = "B",
  T = "T",
}

export const numberFormatUnits = [
  {
    id: ShortUnitId.None,
    divisor: 1,
    display: "",
  },
  {
    id: ShortUnitId.K,
    divisor: 1000,
    display: "K",
  },
  {
    id: ShortUnitId.M,
    divisor: 1000 * 1000,
    display: "M",
  },
  {
    id: ShortUnitId.B,
    divisor: 1000 * 1000 * 1000,
    display: "B",
  },
  {
    id: ShortUnitId.T,
    divisor: 1000 * 1000 * 1000 * 1000,
    display: "T",
  },
];
