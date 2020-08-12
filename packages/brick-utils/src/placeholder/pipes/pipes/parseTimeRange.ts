import moment, { DurationInputArg2 } from "moment";

export function parseTimeRange(value: string): number {
  if (value === "now/d") {
    return +moment().startOf("day");
  }

  if (value === "now/y") {
    return +moment().startOf("year");
  }

  const reg = /^now-(\d+)(\w+)/;

  const matches = reg.exec(value);

  if (matches !== null) {
    const [, num, unit] = matches;
    return +moment().subtract(num, unit as DurationInputArg2);
  }
  return value ? +value : +moment();
}
