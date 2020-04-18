import { Unit } from "./interface";

export enum BytesUnitId {
  Bytes = "bytes",
  Kilobytes = "kilobytes",
  Megabytes = "megabytes",
  Gigabytes = "gigabytes",
  Terabytes = "terabytes",
  Petabytes = "petabytes",
  Bibytes = "bibytes",
  Kibibytes = "kibibytes",
  Mebibytes = "mebibytes",
  Gibibytes = "gibibytes",
  Tebibytes = "tebibytes",
  Pebibytes = "pebibytes",
  // deprecated
  b = "b",
  B = "B",
  KB = "KB",
  MB = "MB",
  GB = "GB",
}

export const bytes: Unit[] = [
  {
    id: BytesUnitId.Bytes,
    alias: ["B", "bytes(B)"],
    divisor: 1,
    display: "B",
  },
  {
    id: BytesUnitId.Kilobytes,
    alias: ["KB", "kilobytes(KB)"],
    divisor: 1024,
    display: "KB",
  },
  {
    id: BytesUnitId.Megabytes,
    alias: ["MB", "megabytes(MB)"],
    divisor: 1024 * 1024,
    display: "MB",
  },
  {
    id: BytesUnitId.Gigabytes,
    alias: ["GB", "gigabytes(GB)"],
    divisor: 1024 * 1024 * 1024,
    display: "GB",
  },
  {
    id: BytesUnitId.Terabytes,
    alias: ["TB", "terabytes(TB)"],
    divisor: 1024 * 1024 * 1024 * 1024,
    display: "TB",
  },
  {
    id: BytesUnitId.Petabytes,
    alias: ["PB", "petabytes(PB)"],
    divisor: 1024 * 1024 * 1024 * 1024 * 1024,
    display: "PB",
  },
];

export const bibytes: Unit[] = [
  {
    id: BytesUnitId.Bibytes,
    alias: ["B", "bibytes(B)"],
    divisor: 1,
    display: "B",
  },
  {
    id: BytesUnitId.Kibibytes,
    alias: ["KiB", "kibibytes(KiB)"],
    divisor: 1000,
    display: "KiB",
  },
  {
    id: BytesUnitId.Mebibytes,
    alias: ["MiB", "mebibytes(MiB)"],
    divisor: 1000 * 1000,
    display: "MiB",
  },
  {
    id: BytesUnitId.Gibibytes,
    alias: ["GiB", "gibibytes(GiB)"],
    divisor: 1000 * 1000 * 1000,
    display: "GiB",
  },
  {
    id: BytesUnitId.Tebibytes,
    alias: ["TiB", "tebibytes(TiB)"],
    divisor: 1000 * 1000 * 1000 * 1000,
    display: "TiB",
  },
  {
    id: BytesUnitId.Pebibytes,
    alias: ["PiB", "pebibytes(PiB)"],
    divisor: 1000 * 1000 * 1000 * 1000 * 1000,
    display: "PiB",
  },
];

export const deprecatedBytes: Unit[] = [
  {
    id: BytesUnitId.b,
    divisor: 1,
    display: "b",
  },
  {
    id: BytesUnitId.B,
    divisor: 8,
    display: "B",
  },
  {
    id: BytesUnitId.KB,
    divisor: 8 * 1024,
    display: "KB",
  },
  {
    id: BytesUnitId.MB,
    divisor: 8 * 1024 * 1024,
    display: "MB",
  },
  {
    id: BytesUnitId.GB,
    divisor: 8 * 1024 * 1024 * 1024,
    display: "GB",
  },
];
