import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { isObject } from "@next-core/brick-utils";
import {
  UseBrickConf,
  UseSingleBrickConf,
  RuntimeBrickElement,
  BrickEventsMap,
  UseBrickSlotsConf,
} from "@next-core/brick-types";
import { bindListeners, unbindListeners } from "./internal/bindListeners";
import { setRealProperties } from "./internal/setProperties";
import {
  RuntimeBrick,
  RuntimeBrickElementWithTplSymbols,
  symbolForParentRefForUseBrickInPortal,
  _internalApiGetCurrentContext,
  _internalApiGetResolver,
  _internalApiGetRouterState,
} from "./core/exports";
import { handleHttpError } from "./handleHttpError";
import { transformProperties, doTransform } from "./transformProperties";
import { looseCheckIfByTransform } from "./checkIf";
import { isPreEvaluated } from "./internal/evaluate";
import { cloneDeepWithInjectedMark } from "./internal/injected";
import {
  listenOnTrackingContext,
  TrackingContextItem,
} from "./internal/listenOnTrackingContext";

interface BrickAsComponentProps {
  useBrick: UseBrickConf;
  data?: unknown;

  /**
   * This is only required for useBrick in portal.
   */
  parentRefForUseBrickInPortal?: React.RefObject<HTMLElement>;
}

interface SingleBrickAsComponentProps extends BrickAsComponentProps {
  useBrick: UseSingleBrickConf;
  refCallback?: (element: HTMLElement) => void;
  immediatelyRefCallback?: (element: HTMLElement) => void;
}

/**
 * 可以渲染单个 `useBrick` 的 React 组件。
 *
 * @example
 *
 * ```tsx
 * <BrickAsComponent
 *   useBrick={{
 *     brick: "your.any-brick"
 *   }}
 *   data={yourData}
 * />
 * ```
 *
 * @param props - 属性。
 */
export const SingleBrickAsComponent = React.memo(
  function SingleBrickAsComponent({
    useBrick,
    data,
    parentRefForUseBrickInPortal,
    refCallback,
    immediatelyRefCallback,
  }: SingleBrickAsComponentProps): React.ReactElement {
    const isBrickAvailable = React.useMemo(() => {
      if (isObject(useBrick.if) && !isPreEvaluated(useBrick.if)) {
        // eslint-disable-next-line
        console.warn("Currently resolvable-if in `useBrick` is not supported.");
      } else if (!looseCheckIfByTransform(useBrick, data)) {
        return false;
      }

      return true;
    }, [useBrick, data]);

    const runtimeBrick = React.useMemo(async () => {
      if (!isBrickAvailable) {
        return null;
      }

      // If the router state is initial, ignore rendering the sub-brick.
      if (_internalApiGetRouterState() === "initial") {
        return;
      }

      const trackingContextList: TrackingContextItem[] = [];

      const brick: RuntimeBrick = {
        type: useBrick.brick,
        // Now transform data in properties too.
        properties: doTransform(
          data,
          cloneDeepWithInjectedMark(useBrick.properties) || {},
          {
            // Keep lazy fields inside `useBrick` inside the `properties`.
            // They will be transformed by their `BrickAsComponent` later.
            $$lazyForUseBrick: true,
            trackingContextList,
          }
        ),
      };
      // Let `transform` works still.
      transformProperties(
        brick.properties,
        data,
        useBrick.transform,
        useBrick.transformFrom
      );

      const runtimeContext = _internalApiGetCurrentContext();

      if (useBrick.lifeCycle) {
        const resolver = _internalApiGetResolver();
        try {
          await resolver.resolve(
            {
              brick: useBrick.brick,
              lifeCycle: useBrick.lifeCycle,
            },
            brick,
            runtimeContext
          );
        } catch (e) {
          handleHttpError(e);
        }
      }

      listenOnTrackingContext(brick, trackingContextList, runtimeContext);

      return brick;
    }, [useBrick, data, isBrickAvailable]);

    const innerRefCallback = React.useCallback(
      async (element: HTMLElement) => {
        immediatelyRefCallback?.(element);
        if (element) {
          const brick = await runtimeBrick;
          // sub-brick rendering is ignored.
          if (!brick) {
            return;
          }
          brick.element = element;
          setRealProperties(element, brick.properties);
          unbindListeners(element);
          if (useBrick.events) {
            bindListeners(element, transformEvents(data, useBrick.events));
          }

          // Memoize the parent ref of useBrick.
          (element as RuntimeBrickElementWithTplSymbols)[
            symbolForParentRefForUseBrickInPortal
          ] = parentRefForUseBrickInPortal;

          if (!useBrick.brick.includes("-")) {
            (element as RuntimeBrickElement).$$typeof = "native";
          } else if (!customElements.get(useBrick.brick)) {
            (element as RuntimeBrickElement).$$typeof = "invalid";
          }
        }

        refCallback?.(element);
      },
      [
        runtimeBrick,
        useBrick,
        data,
        refCallback,
        immediatelyRefCallback,
        parentRefForUseBrickInPortal,
      ]
    );

    if (!isBrickAvailable) {
      return null;
    }

    return React.createElement(
      useBrick.brick,
      {
        ref: innerRefCallback,
      },
      ...slotsToChildren(useBrick.slots).map(
        (item: UseSingleBrickConf, index: number) => (
          <SingleBrickAsComponent key={index} useBrick={item} data={data} />
        )
      )
    );
  }
);

/**
 * 可以渲染 `useBrick` 的 React 组件。
 *
 * @remarks `useBrick` 可以传递单个或多个构件配置。
 *
 * @example
 *
 * ```tsx
 * <BrickAsComponent
 *   useBrick={{
 *     brick: "your.any-brick"
 *   }}
 *   data={yourData}
 *   parentRefForUseBrickInPortal={yourParentElementRef}
 * />
 * ```
 *
 * @param props - 属性。
 */
export function BrickAsComponent({
  useBrick,
  data,
  parentRefForUseBrickInPortal,
}: BrickAsComponentProps): React.ReactElement {
  if (Array.isArray(useBrick)) {
    return (
      <>
        {useBrick.map((item, index) => (
          <SingleBrickAsComponent
            key={index}
            useBrick={item}
            data={data}
            parentRefForUseBrickInPortal={parentRefForUseBrickInPortal}
          />
        ))}
      </>
    );
  }
  return (
    <SingleBrickAsComponent
      useBrick={useBrick}
      data={data}
      parentRefForUseBrickInPortal={parentRefForUseBrickInPortal}
    />
  );
}

function slotsToChildren(slots: UseBrickSlotsConf): UseSingleBrickConf[] {
  if (!slots) {
    return [];
  }
  return Object.entries(slots).flatMap(([slot, slotConf]) =>
    Array.isArray(slotConf.bricks)
      ? slotConf.bricks.map((child) => ({
          ...child,
          properties: {
            ...child.properties,
            slot,
          },
        }))
      : []
  );
}

function transformEvents(
  data: unknown,
  events: BrickEventsMap
): BrickEventsMap {
  return doTransform(data, events, {
    evaluateOptions: {
      lazy: true,
    },
  }) as BrickEventsMap;
}

/* istanbul ignore next */
// eslint-disable-next-line react/display-name
export const ForwardRefSingleBrickAsComponent = React.memo(
  forwardRef<HTMLElement, SingleBrickAsComponentProps>(
    function LegacySingleBrickAsComponent(
      {
        useBrick,
        data,
        parentRefForUseBrickInPortal,
        refCallback,
      }: SingleBrickAsComponentProps,
      ref
    ): React.ReactElement {
      const brickRef = useRef<HTMLElement>();
      const isBrickAvailable = React.useMemo(() => {
        if (isObject(useBrick.if) && !isPreEvaluated(useBrick.if)) {
          // eslint-disable-next-line
          console.warn(
            "Currently resolvable-if in `useBrick` is not supported."
          );
        } else if (!looseCheckIfByTransform(useBrick, data)) {
          return false;
        }

        return true;
      }, [useBrick, data]);

      /* istanbul ignore next (never reach in test) */
      useImperativeHandle(ref, () => {
        return brickRef.current;
      });

      const runtimeBrick = React.useMemo(async () => {
        if (!isBrickAvailable) {
          return null;
        }

        // If the router state is initial, ignore rendering the sub-brick.
        if (_internalApiGetRouterState() === "initial") {
          return;
        }

        const trackingContextList: TrackingContextItem[] = [];

        const brick: RuntimeBrick = {
          type: useBrick.brick,
          // Now transform data in properties too.
          properties: doTransform(
            data,
            cloneDeepWithInjectedMark(useBrick.properties) || {},
            {
              // Keep lazy fields inside `useBrick` inside the `properties`.
              // They will be transformed by their `BrickAsComponent` later.
              $$lazyForUseBrick: true,
              trackingContextList,
            }
          ),
        };
        // Let `transform` works still.
        transformProperties(
          brick.properties,
          data,
          useBrick.transform,
          useBrick.transformFrom
        );

        const runtimeContext = _internalApiGetCurrentContext();

        if (useBrick.lifeCycle) {
          const resolver = _internalApiGetResolver();
          try {
            await resolver.resolve(
              {
                brick: useBrick.brick,
                lifeCycle: useBrick.lifeCycle,
              },
              brick,
              runtimeContext
            );
          } catch (e) {
            handleHttpError(e);
          }
        }

        listenOnTrackingContext(brick, trackingContextList, runtimeContext);

        return brick;
      }, [useBrick, data, isBrickAvailable]);

      const innerRefCallback = React.useCallback(
        async (element: HTMLElement) => {
          brickRef.current = element;

          if (element) {
            const brick = await runtimeBrick;
            // sub-brick rendering is ignored.
            if (!brick) {
              return;
            }
            brick.element = element;
            setRealProperties(element, brick.properties);
            unbindListeners(element);
            if (useBrick.events) {
              bindListeners(element, transformEvents(data, useBrick.events));
            }

            // Memoize the parent ref of useBrick.
            (element as RuntimeBrickElementWithTplSymbols)[
              symbolForParentRefForUseBrickInPortal
            ] = parentRefForUseBrickInPortal;

            if (!useBrick.brick.includes("-")) {
              (element as RuntimeBrickElement).$$typeof = "native";
            } else if (!customElements.get(useBrick.brick)) {
              (element as RuntimeBrickElement).$$typeof = "invalid";
            }
          }
          refCallback?.(element);
        },
        [
          runtimeBrick,
          useBrick,
          data,
          refCallback,
          parentRefForUseBrickInPortal,
        ]
      );

      if (!isBrickAvailable) {
        return null;
      }

      return React.createElement(
        useBrick.brick,
        {
          ref: innerRefCallback,
        },
        ...slotsToChildren(useBrick.slots).map(
          (item: UseSingleBrickConf, index: number) => (
            <SingleBrickAsComponent key={index} useBrick={item} data={data} />
          )
        )
      );
    }
  )
);
