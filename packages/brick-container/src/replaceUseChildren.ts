import type { BrickConf, SlotConfOfBricks } from "@next-core/brick-types";
import { isObject } from "@next-core/brick-utils";

const USE_CHILDREN_SLOT_REGEXP = /^\[\w+\]$/;

/**
 * Replace `useChildren: "[xxx]"` with `useBrick`.
 */
export function replaceUseChildren(bricks: BrickConf[]): void {
  for (const brick of bricks) {
    replaceInBrick(brick);
  }
}

function replaceInBrick(brick: BrickConf): void {
  const slots = brick.slots ?? {};
  const useChildrenMap = new Map<string, BrickConf[]>();
  for (const [slot, slotConf] of Object.entries(slots)) {
    const { bricks: children } = slotConf as SlotConfOfBricks;
    if (USE_CHILDREN_SLOT_REGEXP.test(slot)) {
      if (Array.isArray(children) && children.length > 0) {
        useChildrenMap.set(slot, children);
        replaceUseChildren(children);
      }
      delete slots[slot];
    }

    if (Array.isArray(children)) {
      replaceUseChildren(children);
    }
  }

  if (useChildrenMap.size > 0) {
    replaceInProperties(brick.properties, useChildrenMap);
  }
}

function replaceInProperties(
  value: unknown,
  useChildrenMap: Map<string, BrickConf[]>
): void {
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
