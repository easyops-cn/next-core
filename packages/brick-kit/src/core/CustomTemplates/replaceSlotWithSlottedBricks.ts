import type {
  BrickConf,
  BrickConfInTemplate,
  UseSingleBrickConf,
} from "@next-core/brick-types";
import { hasOwnProperty } from "@next-core/brick-utils";
import { isEvaluable } from "@next-core/cook";
import type { ProxyContext } from "./expandCustomTemplate";

export function replaceSlotWithSlottedBricks<
  T extends BrickConf | UseSingleBrickConf
>(
  brickConf: T,
  proxyContext: ProxyContext,
  expand: (item: T, proxyContext: ProxyContext) => T | T[]
): T[] {
  // Currently, no support for `if` in a slot.
  if (
    (brickConf.if != null && !brickConf.if) ||
    typeof brickConf.if === "string"
  ) {
    throw new Error(
      `Can not use "if" in a slot currently, check your template "${proxyContext.proxyBrick.type}"`
    );
  }

  const slot = String(brickConf.properties?.name ?? "");

  // Currently, no support for expression as slot name.
  if (isEvaluable(slot)) {
    throw new Error(
      `Can not use an expression as slot name "${slot}" currently, check your template "${proxyContext.proxyBrick.type}"`
    );
  }

  // Do not repeat the same slot name in a template.
  if (proxyContext.usedSlots.has(slot)) {
    throw new Error(
      `Can not have multiple slots with the same name "${slot}", check your template "${proxyContext.proxyBrick.type}"`
    );
  }
  proxyContext.usedSlots.add(slot);

  if (
    proxyContext.externalSlots &&
    hasOwnProperty(proxyContext.externalSlots, slot)
  ) {
    const insertBricks = proxyContext.externalSlots[slot].bricks ?? [];
    if (insertBricks.length > 0) {
      return insertBricks as T[];
    }
  }

  return ((brickConf as BrickConfInTemplate).slots?.[""]?.bricks ?? []).flatMap(
    (item) => expand(item as T, proxyContext)
  );
}
