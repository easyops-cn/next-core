export function reverse<T>(value: T[]): T[] {
  return Array.isArray(value) ? value.slice().reverse() : [];
}
