export function substring(value: string, start: number, end?: number): string {
  return typeof value === "string" ? value.substring(start, end) : "";
}
