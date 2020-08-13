import moment from "moment";

interface Period {
  startTime?: number | string;
  endTime?: number | string;
}

function isPeriod(time: unknown): time is Period {
  return typeof time === "object" && time !== null;
}

function getMoment(input: number | string, format: string): moment.Moment {
  return typeof input === "number" ? moment(input) : moment(input, format);
}

export function deltaTime(
  time: number | string | Period,
  withSuffix = true,
  format = "YYYY-MM-DD HH:mm:ss"
): string {
  if (!time) return "";
  if (isPeriod(time) && time.startTime && time.endTime) {
    const startTime = getMoment(time.startTime, format);
    const endTime = getMoment(time.endTime, format);
    return moment.duration(endTime.diff(startTime)).humanize(withSuffix);
  }

  const other = isPeriod(time) ? time.startTime || time.endTime : time;
  const then = getMoment(other, format);
  return moment.duration(then.diff(moment())).humanize(withSuffix);
}
