export enum StateOfUseBrick {
  INITIAL,
  USE_BRICK,
  USE_BRICK_ITEM,
  USE_BRICK_PROPERTIES,
  USE_BRICK_TRANSFORM,
  USE_BRICK_EVENTS,
  USE_BRICK_SLOTS,
  USE_BRICK_SLOTS_ITEM,
  USE_BRICK_SLOTS_ITEM_BRICKS,
  USE_BRICK_SLOTS_ITEM_BRICKS_ITEM,
}

export function isLazyContentInUseBrick(state: StateOfUseBrick): boolean {
  switch (state) {
    case StateOfUseBrick.USE_BRICK_PROPERTIES:
    case StateOfUseBrick.USE_BRICK_TRANSFORM:
    case StateOfUseBrick.USE_BRICK_EVENTS:
      return true;
  }
  return false;
}

export function getNextStateOfUseBrick(
  state: StateOfUseBrick,
  isArray?: boolean,
  key?: string
): StateOfUseBrick {
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
          case "transform":
            return StateOfUseBrick.USE_BRICK_TRANSFORM;
          case "events":
            return StateOfUseBrick.USE_BRICK_EVENTS;
          case "slots":
            return StateOfUseBrick.USE_BRICK_SLOTS;
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
