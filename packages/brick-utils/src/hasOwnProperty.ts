export function hasOwnProperty(
  object: object,
  property: string | number | symbol
): boolean {
  return Object.prototype.hasOwnProperty.call(object, property);
}
