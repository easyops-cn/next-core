export function substr(value: string, from: number, length?: number): string {
  return typeof value === "string" ? value.substr(from, length) : "";
}
