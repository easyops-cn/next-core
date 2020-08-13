export function split(value: string, separator: string): string[] {
  return typeof value === "string" ? value.split(separator) : [];
}
