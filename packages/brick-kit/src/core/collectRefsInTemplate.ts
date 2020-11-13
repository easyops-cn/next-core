import { BrickConfInTemplate, CustomTemplate } from "@easyops/brick-types";

type RefToBrickConfMap = Map<string, BrickConfInTemplate>;

export function collectRefsInTemplate(
  template: CustomTemplate
): RefToBrickConfMap {
  const refMap: RefToBrickConfMap = new Map();
  collectRefsInBrickConfs(template.bricks, refMap);
  return refMap;
}

function collectRefsInBrickConfs(
  brickConfs: BrickConfInTemplate[],
  refMap: RefToBrickConfMap
): void {
  if (Array.isArray(brickConfs)) {
    for (const item of brickConfs) {
      collectRefsInBrickConf(item, refMap);
    }
  }
}

function collectRefsInBrickConf(
  brickConf: BrickConfInTemplate,
  refMap: RefToBrickConfMap
): void {
  const { ref, slots } = brickConf;
  if (ref) {
    refMap.set(ref, brickConf);
  }
  if (slots) {
    for (const slotConf of Object.values(slots)) {
      collectRefsInBrickConfs(slotConf.bricks, refMap);
    }
  }
}
