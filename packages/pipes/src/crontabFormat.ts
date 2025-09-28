import crontab from "@next-libs/crontab";
type CrontabType = "minute" | "hour" | "date" | "month" | "dow";

/**
 * 将forms.crontab-input的value转换为可读字符串
 *
 * @category Others
 *
 * @public
 *
 * @example
 *
 * ```ts
 * crontabFormat("0 6 * * *")
 * // Returns `在上午 06:00`
 * ```
 *
 * @param crontabStr - crontab字符串。
 * @returns 可读字符串。
 */
export function crontabFormat(crontabStr: string): string {
  const crontabTimeObj = parseCrontab(crontabStr);
  return crontab.format(crontabTimeObj, true);
}
function parseCrontab(str = "* * * * *"): Record<CrontabType, string> {
  const [minute, hour, date, month, dow] = str.split(" ");
  return {
    minute,
    hour,
    date,
    month,
    dow,
  };
}
