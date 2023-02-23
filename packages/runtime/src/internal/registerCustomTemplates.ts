import { RuntimeStoryboard } from "@next-core/types";
import { customTemplates } from "../CustomTemplates.js";

export function registerCustomTemplates(storyboard: RuntimeStoryboard) {
  if (storyboard.$$registerCustomTemplateProcessed) {
    return;
  }
  storyboard.$$registerCustomTemplateProcessed = true;
  const templates = storyboard.meta?.customTemplates;
  if (Array.isArray(templates)) {
    for (const tpl of templates) {
      const tagName = tpl.name.includes(".")
        ? tpl.name
        : `${storyboard.app.id}.${tpl.name}`;
      customTemplates.define(tagName, tpl);
    }
  }
}
