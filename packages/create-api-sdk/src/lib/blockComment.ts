export function blockComment(
  content: string,
  prefix?: string,
  suffix?: string
): string {
  return `${prefix ?? "/** "}${content.replaceAll("*/", "*\\/")}${suffix ?? " */"}`;
}
