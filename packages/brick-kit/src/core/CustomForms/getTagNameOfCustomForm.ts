import { customFormRegistry } from "./constants";

// If it's a custom form, return the tag name of the form.
// Otherwise, return false.
export function getTagNameOfCustomForm(
  brick: string,
  appId?: string
): false | string {
  if (!brick.includes(".") && appId) {
    const tagName = `${appId}.${brick}`;
    if (customFormRegistry.has(tagName)) {
      return tagName;
    }
  }
  if (customFormRegistry.has(brick)) {
    return brick;
  }
  return false;
}
