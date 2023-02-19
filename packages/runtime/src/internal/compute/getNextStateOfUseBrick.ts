export enum StateOfUseBrick {
  INITIAL,
  USE_BRICK,
  USE_BRICK_ITEM,
  USE_BRICK_PROPERTIES,
  USE_BRICK_EVENTS,
  USE_BRICK_IF,
  USE_BRICK_SLOTS,
  USE_BRICK_SLOTS_ITEM,
  USE_BRICK_SLOTS_ITEM_BRICKS,
  USE_BRICK_SLOTS_ITEM_BRICKS_ITEM,
  USE_BRICK_LIFECYCLE,
}

export function isLazyContentInUseBrick(
  state: StateOfUseBrick | undefined
): boolean {
  switch (state) {
    case StateOfUseBrick.USE_BRICK_PROPERTIES:
    case StateOfUseBrick.USE_BRICK_EVENTS:
    case StateOfUseBrick.USE_BRICK_IF:
    case StateOfUseBrick.USE_BRICK_LIFECYCLE:
      return true;
  }
  return false;
}

export function getNextStateOfUseBrick(
  state: StateOfUseBrick | undefined,
  isArray?: boolean,
  key?: string
): StateOfUseBrick | undefined {
  if (isLazyContentInUseBrick(state)) {
    return state;
  }
  if (isArray) {
    switch (state) {
      case StateOfUseBrick.USE_BRICK:
        return StateOfUseBrick.USE_BRICK_ITEM;
      case StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS:
        return StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS_ITEM;
    }
  } else {
    switch (state) {
      case StateOfUseBrick.INITIAL:
        if (key === "useBrick") {
          return StateOfUseBrick.USE_BRICK;
        }
        break;
      case StateOfUseBrick.USE_BRICK:
      case StateOfUseBrick.USE_BRICK_ITEM:
      case StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS_ITEM: {
        switch (key) {
          case "properties":
            return StateOfUseBrick.USE_BRICK_PROPERTIES;
          case "events":
            return StateOfUseBrick.USE_BRICK_EVENTS;
          case "slots":
            return StateOfUseBrick.USE_BRICK_SLOTS;
          case "children":
            return StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS;
          case "if":
            return StateOfUseBrick.USE_BRICK_IF;
          case "lifeCycle":
            return StateOfUseBrick.USE_BRICK_LIFECYCLE;
        }
        break;
      }
      case StateOfUseBrick.USE_BRICK_SLOTS:
        return StateOfUseBrick.USE_BRICK_SLOTS_ITEM;
      case StateOfUseBrick.USE_BRICK_SLOTS_ITEM:
        if (key === "bricks") {
          return StateOfUseBrick.USE_BRICK_SLOTS_ITEM_BRICKS;
        }
        break;
    }
  }
  return StateOfUseBrick.INITIAL;
}
