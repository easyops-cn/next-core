import { BrickTemplateFactory, TemplateRegistry } from "@easyops/brick-types";

export const brickTemplateRegistry: TemplateRegistry<
  BrickTemplateFactory
> = new Map();

export function registerBrickTemplate(
  name: string,
  factory: BrickTemplateFactory
): void {
  if (brickTemplateRegistry.has(name)) {
    // eslint-disable-next-line no-console
    console.error(`Brick template of "${name}" already registered.`);
    return;
  }
  brickTemplateRegistry.set(name, factory);
}
