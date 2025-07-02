import type { BrickConf, SlotConfOfBricks } from "@next-core/types";
import { isObject } from "@next-core/utils/general";
import { pull } from "lodash";

const USE_CHILDREN_SLOT_REGEXP = /^\[\w+\]$/;

/**
 * Replace `useChildren: "[xxx]"` with `useBrick`.
 *
 * This will mutate the input.
 */
export function replaceUseChildren(input: BrickConf | BrickConf[]) {
  if (Array.isArray(input)) {
    for (const brick of input) {
      replaceInBrick(brick);
    }
  } else {
    replaceInBrick(input);
  }
}

function replaceInBrick(brick: BrickConf) {
  let slots = brick.slots;
  const useChildrenMap = new Map<string, BrickConf[]>();
  if (Array.isArray(brick.children) && !slots) {
    const removeBricks: BrickConf[] = [];
    for (const child of brick.children) {
      const slot = child.slot ?? "";
      if (USE_CHILDREN_SLOT_REGEXP.test(slot)) {
        delete child.slot;
        const children = useChildrenMap.get(slot);
        if (children) {
          children.push(child);
        } else {
          useChildrenMap.set(slot, [child]);
        }
        removeBricks.push(child);
      }
      replaceInBrick(child);
    }
    pull(brick.children, ...removeBricks);
  } else {
    slots ??= {};
    for (const [slot, slotConf] of Object.entries(slots)) {
      if (USE_CHILDREN_SLOT_REGEXP.test(slot)) {
        const { bricks: children } = slotConf as SlotConfOfBricks;
        if (Array.isArray(children) && children.length > 0) {
          useChildrenMap.set(slot, children);
          replaceUseChildren(children);
        }
        delete slots[slot];
      }

      if (Array.isArray((slotConf as SlotConfOfBricks).bricks)) {
        replaceUseChildren((slotConf as SlotConfOfBricks).bricks);
      }
    }
  }

  if (useChildrenMap.size > 0) {
    replaceInProperties(brick.properties, useChildrenMap);
  }
}

function replaceInProperties(
  value: unknown,
  useChildrenMap: Map<string, BrickConf[]>
) {
  if (Array.isArray(value)) {
    for (const item of value) {
      replaceInProperties(item, useChildrenMap);
    }
  } else if (isObject(value)) {
    for (const [k, v] of Object.entries(value)) {
      if (k === "useChildren") {
        const children = useChildrenMap.get(v as string);
        if (children) {
          delete value[k];
          value.useBrick = children.length === 1 ? children[0] : children;
        }
      } else {
        replaceInProperties(v, useChildrenMap);
      }
    }
  }
}
