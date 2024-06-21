import { __secret_internals } from "@next-core/runtime";
import {
  wrapBrick,
  type WrappedBrick,
  type WrappedBrickWithEventsMap,
} from "@next-core/react-element";

/**
 * 使用异步加载的方式包装一个构件，可用于按条件渲染的构件依赖。
 *
 * 例如提供复杂弹层内容的按钮构件，其内容需要使用到一些大型构件，那么这些依赖可以使用 asyncWrapBrick，
 * 这样只有在需要时才会加载这些依赖的构件。
 */
export async function asyncWrapBrick<
  T extends HTMLElement,
  P,
  E,
  M extends object,
>(
  BrickName: string,
  eventsMapping: M
): Promise<WrappedBrickWithEventsMap<T, P, E, M>>;

/**
 * 使用异步加载的方式包装一个构件，可用于按条件渲染的构件依赖。
 *
 * 例如提供复杂弹层内容的按钮构件，其内容需要使用到一些大型构件，那么这些依赖可以使用 asyncWrapBrick，
 * 这样只有在需要时才会加载这些依赖的构件。
 */
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
