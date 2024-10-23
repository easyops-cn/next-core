import type {
  BrickConf,
  SlotsConfInTemplate,
  UseSingleBrickConf,
} from "@next-core/types";
import { hasOwnProperty } from "@next-core/utils/general";
import { isEvaluable } from "@next-core/cook";
import type { TemplateHostContext } from "../interfaces.js";
import { setupTemplateExternalBricksWithForEach } from "./setupTemplateProxy.js";
import { childrenToSlots } from "../Renderer.js";

export function replaceSlotWithSlottedBricks<
  T extends BrickConf | UseSingleBrickConf,
>(
  brickConf: T,
  hostContext: TemplateHostContext,
  expand: (item: T, hostContext: TemplateHostContext) => T | T[]
): T[] {
  // Currently, no support for `if` in a slot.
  if (
    (brickConf.if != null && !brickConf.if) ||
    typeof brickConf.if === "string"
  ) {
    throw new Error(
      `Can not use "if" in a slot currently, check your template "${hostContext.hostBrick.type}"`
    );
  }

  const slot = String(brickConf.properties?.name ?? "");

  // Currently, no support for expression as slot name.
  if (isEvaluable(slot)) {
    throw new Error(
      `Can not use an expression as slot name "${slot}" currently, check your template "${hostContext.hostBrick.type}"`
    );
  }

  // Do not repeat the same slot name in a template.
  if (hostContext.usedSlots.has(slot)) {
    throw new Error(
      `Can not have multiple slots with the same name "${slot}", check your template "${hostContext.hostBrick.type}"`
    );
  }
  hostContext.usedSlots.add(slot);

  if (
    hostContext.externalSlots &&
    hasOwnProperty(hostContext.externalSlots, slot)
  ) {
    const insertBricks = hostContext.externalSlots[slot].bricks ?? [];
    if (insertBricks.length > 0) {
      const hostCtx = hostContext.hostBrick.runtimeContext;
      // External bricks of a template, should not access the template internal forEach `ITEM`.
      // For some existing templates who is *USING* this bug, we keep the old behavior.
      const hostHasForEach = hasOwnProperty(hostCtx, "forEachItem");
      return (
        hostHasForEach
          ? setupTemplateExternalBricksWithForEach(
              insertBricks,
              hostCtx.forEachItem,
              hostCtx.forEachIndex!,
              hostCtx.forEachSize!
            )
          : insertBricks
      ) as T[];
    }
  }

  const defaultSlots = childrenToSlots(brickConf.children, brickConf.slots) as
    | SlotsConfInTemplate
    | undefined;
  return (defaultSlots?.[""]?.bricks ?? []).flatMap((item) =>
    expand(item as T, hostContext)
  );
}
