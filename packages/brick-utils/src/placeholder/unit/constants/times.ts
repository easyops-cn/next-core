import { Unit } from "./interface";

export enum TimesUnitId {
  Nanosecond = "nanoseconds",
  Microsecond = "microseconds",
  Milliseconds = "milliseconds",
  Seconds = "seconds",
  Minutes = "minutes",
  Hours = "hours",
  Days = "days",
  Weeks = "weeks",
  Months = "months",
  Years = "years",
  // deprecated
  ms = "ms",
  s = "s",
  min = "min",
  hour = "hour",
  day = "day",
  week = "week",
}

export const times: Unit[] = [
  {
    id: TimesUnitId.Nanosecond,
    alias: ["ns", "nanoseconds(ns)"],
    divisor: 1,
    display: "ns",
  },
  {
    id: TimesUnitId.Microsecond,
    alias: ["μs", "microseconds(μs)"],
    divisor: 1000,
    display: "μs",
  },
  {
    id: TimesUnitId.Milliseconds,
    alias: ["ms", "milliseconds(ms)"],
    divisor: 1000 * 1000,
    display: "ms",
  },
  {
    id: TimesUnitId.Seconds,
    alias: ["s", "seconds(s)"],
    divisor: 1000 * 1000 * 1000,
    display: "s",
  },
  {
    id: TimesUnitId.Minutes,
    alias: ["min", "minutes(min)"],
    divisor: 1000 * 1000 * 1000 * 60,
    display: "min",
  },
  {
    id: TimesUnitId.Hours,
    alias: ["hour", "hours(hour)"],
    divisor: 1000 * 1000 * 1000 * 60 * 60,
    display: "hour",
  },
  {
    id: TimesUnitId.Days,
    alias: ["day", "days(day)"],
    divisor: 1000 * 1000 * 1000 * 60 * 60 * 24,
    display: "day",
  },
  {
    id: TimesUnitId.Weeks,
    alias: ["week", "weeks(week)"],
    divisor: 1000 * 1000 * 1000 * 60 * 60 * 24 * 7,
    display: "week",
  },
  {
    id: TimesUnitId.Months,
    alias: ["month", "months(month)"],
    divisor: 1000 * 1000 * 1000 * 60 * 60 * 24 * 30,
    display: "month",
  },
  {
    id: TimesUnitId.Years,
    alias: ["year", "years(year)"],
    divisor: 1000 * 1000 * 1000 * 60 * 60 * 24 * 365,
    display: "year",
  },
];

export const deprecatedTimes: Unit[] = [
  {
    id: TimesUnitId.ms,
    divisor: 1,
    display: "毫秒",
  },
  {
    id: TimesUnitId.s,
    divisor: 1000,
    display: "秒",
  },
  {
    id: TimesUnitId.min,
    divisor: 1000 * 60,
    display: "分",
  },
  {
    id: TimesUnitId.hour,
    divisor: 1000 * 60 * 60,
    display: "小时",
  },
  {
    id: TimesUnitId.day,
    divisor: 1000 * 60 * 60 * 24,
    display: "天",
  },
  {
    id: TimesUnitId.week,
    divisor: 1000 * 60 * 60 * 24 * 7,
    display: "周",
  },
];
