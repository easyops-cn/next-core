import type { CustomTemplate } from "@next-core/types";
import { CustomTemplateRegistry } from "../CustomTemplates.js";

export const isolatedTemplateRegistryMap = new Map<
  symbol,
  CustomTemplateRegistry
>();

export function registerIsolatedTemplates(
  isolatedRoot: symbol,
  templates: CustomTemplate[] | undefined
) {
  let registry = isolatedTemplateRegistryMap.get(isolatedRoot);
  if (!registry) {
    registry = new CustomTemplateRegistry(true);
    isolatedTemplateRegistryMap.set(isolatedRoot, registry);
  }
  registry.clearIsolatedRegistry();
  if (Array.isArray(templates)) {
    for (const tpl of templates) {
      registry.define(tpl.name, tpl);
    }
  }
}
