export function hasOwnProperty(
  object: unknown,
  property: string | number | symbol
): boolean {
  return Object.prototype.hasOwnProperty.call(object, property);
}
