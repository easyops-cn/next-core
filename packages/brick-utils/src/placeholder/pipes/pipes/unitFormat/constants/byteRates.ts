import { Unit } from "./interface";

export enum ByteRatesUnitId {
  BitsPerSecond = "bits/sec",
  KilobitsPerSecond = "kilobits/sec",
  MegabitsPerSecond = "megabits/sec",
  GigabitsPerSecond = "gigabits/sec",
  BytesPerSecond = "bytes/sec",
  KilobytesPerSecond = "kilobytes/sec",
  MegabytesPerSecond = "megabytes/sec",
  GigabytesPerSecond = "gigabytes/sec",
  // deprecated
  bps = "bps",
  Bps = "Bps",
  KBps = "KBps",
  MBps = "MBps",
  GBps = "GBps",
}

export const bitRates: Unit[] = [
  {
    id: ByteRatesUnitId.BitsPerSecond,
    alias: ["bps", "bits/sec(bps)"],
    divisor: 1,
    display: "bps",
  },
  {
    id: ByteRatesUnitId.KilobitsPerSecond,
    alias: ["Kbps", "kilobits/sec(Kbps)"],
    divisor: 1024,
    display: "Kbps",
  },
  {
    id: ByteRatesUnitId.MegabitsPerSecond,
    alias: ["Mbps", "megabits/sec(Mbps)"],
    divisor: 1024 * 1024,
    display: "Mbps",
  },
  {
    id: ByteRatesUnitId.GigabitsPerSecond,
    alias: ["Gbps", "gigabits/sec(Gbps)"],
    divisor: 1024 * 1024 * 1024,
    display: "Gbps",
  },
];

export const byteRates: Unit[] = [
  {
    id: ByteRatesUnitId.BytesPerSecond,
    alias: ["Bps", "bytes/sec(Bps)"],
    divisor: 8,
    display: "Bps",
  },
  {
    id: ByteRatesUnitId.KilobytesPerSecond,
    alias: ["KBps", "kilobytes/sec(KBps)"],
    divisor: 8 * 1024,
    display: "KBps",
  },
  {
    id: ByteRatesUnitId.MegabytesPerSecond,
    alias: ["MBps", "megabytes/sec(MBps)"],
    divisor: 8 * 1024 * 1024,
    display: "MBps",
  },
  {
    id: ByteRatesUnitId.GigabytesPerSecond,
    alias: ["GBps", "gigabytes/sec(GBps)"],
    divisor: 8 * 1024 * 1024 * 1024,
    display: "GBps",
  },
];

export const deprecatedByteRates: Unit[] = [
  {
    id: ByteRatesUnitId.bps,
    divisor: 1,
    display: "bps",
  },
  {
    id: ByteRatesUnitId.Bps,
    divisor: 8,
    display: "Bps",
  },
  {
    id: ByteRatesUnitId.KBps,
    divisor: 8 * 1024,
    display: "KBps",
  },
  {
    id: ByteRatesUnitId.MBps,
    divisor: 8 * 1024 * 1024,
    display: "MBps",
  },
  {
    id: ByteRatesUnitId.GBps,
    divisor: 8 * 1024 * 1024 * 1024,
    display: "GBps",
  },
];
