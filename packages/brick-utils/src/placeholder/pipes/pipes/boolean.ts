export function boolean(value: unknown): boolean {
  // Consider `"0"` as false.
  return value !== "0" && Boolean(value);
}
