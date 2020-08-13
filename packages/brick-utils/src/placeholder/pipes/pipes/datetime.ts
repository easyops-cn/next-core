import moment from "moment";

export function datetime(value: number | string, format: string): string {
  return moment(value).format(format);
}
