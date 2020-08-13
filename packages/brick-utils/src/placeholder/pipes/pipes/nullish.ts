export function nullish<T, U>(value: T, defaultValue: U): T | U {
  return value ?? defaultValue;
}
