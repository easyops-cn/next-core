import { customTemplateRegistry } from "./constants";

// If it's a custom template, return the tag name of the template.
// Otherwise, return false.
export function getTagNameOfCustomTemplate(
  brick: string,
  appId?: string
): false | string {
  // When a template is registered by an app, it's namespace maybe missed.
  if (!brick.includes(".") && appId) {
    const tagName = `${appId}.${brick}`;
    if (customTemplateRegistry.has(tagName)) {
      return tagName;
    }
  }
  if (customTemplateRegistry.has(brick)) {
    return brick;
  }
  return false;
}
