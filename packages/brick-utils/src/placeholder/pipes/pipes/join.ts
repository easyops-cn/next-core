export function join(value: unknown[], separator: string): string {
  return Array.isArray(value) ? value.join(separator) : "";
}
