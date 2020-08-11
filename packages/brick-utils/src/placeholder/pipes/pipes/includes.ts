export function includes(
  value: string | unknown[],
  part: string | unknown
): boolean {
  return value.includes(part as any);
}
