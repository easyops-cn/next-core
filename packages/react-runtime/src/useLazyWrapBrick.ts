import { lazy, useMemo, type LazyExoticComponent } from "react";
import type {
  WrappedBrick,
  WrappedBrickWithEventsMap,
} from "@next-core/react-element";
import { asyncWrapBrick } from "./asyncWrapBrick.js";

/**
 * 使用 `React.lazy` 包装一个异步加载的构件。
 *
 * ```jsx
 * const DepComponent = useLazyWrapBrick("async-dep");
 * return (
 *   <Suspense fallback="Loading...">
 *    <DepComponent {...props} />
 *   </Suspense>
 * );
 * ```
 */
export function useLazyWrapBrick<T extends HTMLElement, P, E, M extends object>(
  brickName: string,
  eventsMapping?: M
): LazyExoticComponent<WrappedBrickWithEventsMap<T, P, E, M>>;

/**
 * 使用 `React.lazy` 包装一个异步加载的构件。
 *
 * ```jsx
 * const DepComponent = useLazyWrapBrick("async-dep");
 * return (
 *   <Suspense fallback="Loading...">
 *    <DepComponent {...props} />
 *   </Suspense>
 * );
 * ```
 */
export function useLazyWrapBrick<T extends HTMLElement, P>(
  brickName: string
): LazyExoticComponent<WrappedBrick<T, P>>;

export function useLazyWrapBrick<
  _T extends HTMLElement,
  _P,
  _E,
  M extends object,
>(brickName: undefined | null, eventsMapping?: M): null;

export function useLazyWrapBrick<_T extends HTMLElement, _P>(
  brickName: undefined | null
): null;

/**
 * 使用 `React.lazy` 包装一个异步加载的构件。
 *
 * ```jsx
 * const DepComponent = useLazyWrapBrick("async-dep");
 * return (
 *   <Suspense fallback="Loading...">
 *    <DepComponent {...props} />
 *   </Suspense>
 * );
 * ```
 */
export function useLazyWrapBrick<T extends HTMLElement, P, E, M extends object>(
  brickName: string | undefined | null,
  eventsMapping?: M
): LazyExoticComponent<WrappedBrickWithEventsMap<T, P, E, M>> | null;

/**
 * 使用 `React.lazy` 包装一个异步加载的构件。
 *
 * ```jsx
 * const DepComponent = useLazyWrapBrick("async-dep");
 * return (
 *   <Suspense fallback="Loading...">
 *    <DepComponent {...props} />
 *   </Suspense>
 * );
 * ```
 */
export function useLazyWrapBrick<T extends HTMLElement, P>(
  brickName: string | undefined | null
): LazyExoticComponent<WrappedBrick<T, P>> | null;

export function useLazyWrapBrick<T extends HTMLElement, P, E, M extends object>(
  brickName: string | undefined | null,
  eventsMapping?: M
) {
  return useMemo(() => {
    if (brickName != null) {
      return lazy(async () => ({
        default: await asyncWrapBrick<T, P, E, M>(
          brickName,
          eventsMapping as M
        ),
      }));
    }
    return null;
  }, [brickName, eventsMapping]);
}
