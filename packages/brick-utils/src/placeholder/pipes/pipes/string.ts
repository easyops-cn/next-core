export function string(value: unknown): string {
  // Consider `undefined` and `null` as `""`.
  return value === undefined || value === null ? "" : String(value);
}
