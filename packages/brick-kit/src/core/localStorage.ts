/**
 * When passed a localStorage key name,will return that key's value as json.
 *
 * @param name - Required localStorage key name.
 */
export function getItem(name: string): any {
  return JSON.parse(localStorage.getItem(name));
}
