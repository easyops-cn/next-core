import { describe, test, expect } from "@jest/globals";
import {
  StateOfUseBrick,
  getNextStateOfUseBrick,
  isLazyContentInUseBrick,
} from "./getNextStateOfUseBrick.js";

describe("getNextStateOfUseBrick", () => {
  test.each<
    [
      StateOfUseBrick | undefined,
      boolean,
      string | undefined,
      StateOfUseBrick,
      boolean
    ]
  >([
    [undefined, false, "useBrick", StateOfUseBrick.INITIAL, false],
    [undefined, false, "other", StateOfUseBrick.INITIAL, false],
    [StateOfUseBrick.INITIAL, false, "other", StateOfUseBrick.INITIAL, false],
    [
      StateOfUseBrick.INITIAL,
      false,
      "useBrick",
      StateOfUseBrick.USE_BRICK,
      false,
    ],
    [StateOfUseBrick.USE_BRICK, false, "brick", StateOfUseBrick.INITIAL, false],
    [
      StateOfUseBrick.USE_BRICK,
      false,
      "properties",
      StateOfUseBrick.USE_BRICK_PROPERTIES,
      true,
    ],
    [
      StateOfUseBrick.USE_BRICK,
      false,
      "dataSource",
      StateOfUseBrick.USE_BRICK_DATA_SOURCE,
      true,
    ],
    [
      StateOfUseBrick.USE_BRICK,
      false,
      "events",
      StateOfUseBrick.USE_BRICK_EVENTS,
      true,
    ],
    [
      StateOfUseBrick.USE_BRICK,
      false,
      "slots",
      StateOfUseBrick.USE_BRICK_SLOTS,
      false,
    ],
    [
      StateOfUseBrick.USE_BRICK,
      false,
      "children",
      StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS,
      false,
    ],
    [
      StateOfUseBrick.USE_BRICK,
      false,
      "if",
      StateOfUseBrick.USE_BRICK_IF,
      true,
    ],
    [
      StateOfUseBrick.USE_BRICK,
      false,
      "lifeCycle",
      StateOfUseBrick.USE_BRICK_LIFECYCLE,
      true,
    ],
    [
      StateOfUseBrick.USE_BRICK_SLOTS,
      false,
      "x",
      StateOfUseBrick.USE_BRICK_SLOTS_ITEM,
      false,
    ],
    [
      StateOfUseBrick.USE_BRICK_SLOTS_ITEM,
      false,
      "bricks",
      StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS,
      false,
    ],
    [
      StateOfUseBrick.USE_BRICK_SLOTS_ITEM,
      false,
      "type",
      StateOfUseBrick.INITIAL,
      false,
    ],
    [
      StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS,
      true,
      undefined,
      StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS_ITEM,
      false,
    ],
    [
      StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS_ITEM,
      false,
      "if",
      StateOfUseBrick.USE_BRICK_IF,
      true,
    ],
    [
      StateOfUseBrick.USE_BRICK,
      true,
      undefined,
      StateOfUseBrick.USE_BRICK_ITEM,
      false,
    ],
    [
      StateOfUseBrick.USE_BRICK_ITEM,
      false,
      "if",
      StateOfUseBrick.USE_BRICK_IF,
      true,
    ],
    [
      StateOfUseBrick.USE_BRICK_LIFECYCLE,
      false,
      "onMount",
      StateOfUseBrick.USE_BRICK_LIFECYCLE,
      true,
    ],
  ])(
    "getNextStateOfUseBrick(%j, %j, %j) should return %j. Is it a lazy content? %j",
    (state, isArray, key, nextState, isLazy) => {
      const result = getNextStateOfUseBrick(state, isArray, key);
      expect(result).toBe(nextState);
      expect(isLazyContentInUseBrick(nextState)).toBe(isLazy);
    }
  );
});
