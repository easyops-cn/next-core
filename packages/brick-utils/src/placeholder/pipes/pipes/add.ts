export function add(
  value: number | string,
  operand: number | string
): number | string {
  return (value as any) + (operand as any);
}
