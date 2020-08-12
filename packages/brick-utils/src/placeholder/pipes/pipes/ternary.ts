export function ternary<T, U>(
  value: boolean,
  resultIfTrue: T,
  resultIfFalse: U
): T | U {
  return value ? resultIfTrue : resultIfFalse;
}
