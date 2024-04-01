import { __secret_internals } from "@next-core/runtime";
import {
  wrapBrick,
  type WrappedBrick,
  type WrappedBrickWithEventsMap,
} from "@next-core/react-element";

export async function asyncWrapBrick<
  T extends HTMLElement,
  P,
  E,
  M extends object,
>(
  BrickName: string,
  eventsMapping: M
): Promise<WrappedBrickWithEventsMap<T, P, E, M>>;

export async function asyncWrapBrick<T extends HTMLElement, P>(
  BrickName: string
): Promise<WrappedBrick<T, P>>;

export async function asyncWrapBrick<
  T extends HTMLElement,
  P,
  E,
  M extends object,
>(brickName: string, eventsMapping?: M) {
  await __secret_internals.loadBricks([brickName]);
  return wrapBrick<T, P, E, M>(brickName, eventsMapping as M);
}
