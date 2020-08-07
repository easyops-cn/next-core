// Ref https://github.com/lodash/lodash/blob/4.17.11/lodash.js#L11744
export function isObject(value: unknown): value is Record<string, any> {
  const type = typeof value;
  return value != null && (type == "object" || type == "function");
}
