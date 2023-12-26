import { isObject } from "@next-core/utils/general";
import type {
  BrickConf,
  UseBrickSlotsConf,
  UseSingleBrickConf,
} from "@next-core/types";
import {
  RuntimeContext,
  RuntimeUseBrickConfWithRootSymbols,
  symbolForRootRuntimeContext,
} from "./secret_internals.js";
import { childrenToSlots } from "./Renderer.js";

export function setupRootRuntimeContext(
  bricks: BrickConf[],
  runtimeContext: RuntimeContext
) {
  function walk(props: unknown) {
    if (!isObject(props) || typeof props === "function") {
      return;
    }

    if (Array.isArray(props)) {
      props.map(walk);
      return;
    }

    for (const [key, value] of Object.entries(props)) {
      if (isObject(value) && key === "useBrick") {
        if (Array.isArray(value)) {
          value.forEach((v) => setupBrick(v, true));
        } else {
          setupBrick(
            value as UseSingleBrickConf as RuntimeUseBrickConfWithRootSymbols,
            true
          );
        }
      } else {
        walk(value);
      }
    }
  }

  function setupBrick(brick: BrickConf, inUseBrick?: boolean) {
    if (inUseBrick) {
      (brick as RuntimeUseBrickConfWithRootSymbols)[
        symbolForRootRuntimeContext
      ] = runtimeContext;
    }
    const { properties, slots: originalSlots, children } = brick;
    const transpiledSlots = childrenToSlots(children, originalSlots) as
      | UseBrickSlotsConf
      | undefined;

    walk(properties);

    for (const slotConf of Object.values(transpiledSlots ?? {})) {
      for (const brick of slotConf.bricks ?? []) {
        setupBrick(brick, inUseBrick);
      }
    }
  }

  for (const brick of bricks) {
    setupBrick(brick);
  }
}
