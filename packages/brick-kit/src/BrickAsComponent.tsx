import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { cloneDeep } from "lodash";
import { isObject } from "@easyops/brick-utils";
import {
  UseBrickConf,
  UseSingleBrickConf,
  RuntimeBrickElement,
  BrickEventsMap,
  UseBrickSlotsConf,
  BrickEventHandler,
} from "@easyops/brick-types";
import { bindListeners, unbindListeners } from "./bindListeners";
import { setRealProperties } from "./setProperties";
import {
  RuntimeBrick,
  _internalApiGetResolver,
  _internalApiGetRouterState,
} from "./core/exports";
import { handleHttpError } from "./handleHttpError";
import { transformProperties, doTransform } from "./transformProperties";
import { looseCheckIfByTransform } from "./checkIf";

interface BrickAsComponentProps {
  useBrick: UseBrickConf;
  data?: unknown;
}

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
 * />
 * ```
 *
 * @param props - 属性。
 */
export function BrickAsComponent(
  props: BrickAsComponentProps
): React.ReactElement {
  if (Array.isArray(props.useBrick)) {
    return (
      <>
        {props.useBrick.map((item, index) => (
          <SingleBrickAsComponent
            key={index}
            useBrick={item}
            data={props.data}
          />
        ))}
      </>
    );
  }
  return <SingleBrickAsComponent useBrick={props.useBrick} data={props.data} />;
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
export function SingleBrickAsComponent(
  props: SingleBrickAsComponentProps
): React.ReactElement {
  const { useBrick, data, refCallback, immediatelyRefCallback } = props;

  const runtimeBrick = React.useMemo(async () => {
    // If the router state is initial, ignore rendering the sub-brick.
    if (_internalApiGetRouterState() === "initial") {
      return;
    }
    const brick: RuntimeBrick = {
      type: useBrick.brick,
      properties: cloneDeep(useBrick.properties) || {},
    };
    transformProperties(
      brick.properties,
      data,
      useBrick.transform,
      useBrick.transformFrom
    );
    if (useBrick.lifeCycle) {
      const resolver = _internalApiGetResolver();
      try {
        await resolver.resolve(
          {
            brick: useBrick.brick,
            lifeCycle: useBrick.lifeCycle,
          },
          brick
        );
      } catch (e) {
        handleHttpError(e);
      }
    }
    return brick;
  }, [useBrick, data]);

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

        if (!useBrick.brick.includes("-")) {
          (element as RuntimeBrickElement).$$typeof = "native";
        } else if (!customElements.get(useBrick.brick)) {
          (element as RuntimeBrickElement).$$typeof = "invalid";
        }
      }

      refCallback?.(element);
    },
    [runtimeBrick, useBrick, data, refCallback, immediatelyRefCallback]
  );

  if (isObject(useBrick.if)) {
    // eslint-disable-next-line
    console.warn("Currently resolvable-if in `useBrick` is not supported.");
  } else if (!looseCheckIfByTransform(useBrick, data)) {
    return null;
  }

  return React.createElement(
    useBrick.brick,
    {
      ref: innerRefCallback,
    },
    ...slotsToChildren(
      useBrick.slots
    ).map((item: UseSingleBrickConf, index: number) => (
      <SingleBrickAsComponent key={index} useBrick={item} data={data} />
    ))
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
  const options = {
    evaluateOptions: {
      lazy: true,
    },
  };
  return Object.fromEntries(
    Object.entries(events).map(([eventType, eventConf]) => [
      eventType,
      Array.isArray(eventConf)
        ? eventConf.map(
            (item) => doTransform(data, item, options) as BrickEventHandler
          )
        : (doTransform(data, eventConf, options) as BrickEventHandler),
    ])
  );
}

/* istanbul ignore next */
export const ForwardRefSingleBrickAsComponent = forwardRef<
  HTMLElement,
  SingleBrickAsComponentProps
>(function LegacySingleBrickAsComponent(
  props: SingleBrickAsComponentProps,
  ref
): React.ReactElement {
  const { useBrick, data, refCallback } = props;
  const brickRef = useRef<HTMLElement>();

  /* istanbul ignore next (never reach in test) */
  useImperativeHandle(ref, () => {
    return brickRef.current;
  });

  const runtimeBrick = React.useMemo(async () => {
    // If the router state is initial, ignore rendering the sub-brick.
    if (_internalApiGetRouterState() === "initial") {
      return;
    }
    const brick: RuntimeBrick = {
      type: useBrick.brick,
      properties: cloneDeep(useBrick.properties) || {},
    };
    transformProperties(
      brick.properties,
      data,
      useBrick.transform,
      useBrick.transformFrom
    );
    if (useBrick.lifeCycle) {
      const resolver = _internalApiGetResolver();
      try {
        await resolver.resolve(
          {
            brick: useBrick.brick,
            lifeCycle: useBrick.lifeCycle,
          },
          brick
        );
      } catch (e) {
        handleHttpError(e);
      }
    }
    return brick;
  }, [useBrick, data]);

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

        if (!useBrick.brick.includes("-")) {
          (element as RuntimeBrickElement).$$typeof = "native";
        } else if (!customElements.get(useBrick.brick)) {
          (element as RuntimeBrickElement).$$typeof = "invalid";
        }
      }
      refCallback?.(element);
    },
    [runtimeBrick, useBrick, data, refCallback]
  );

  if (isObject(useBrick.if)) {
    // eslint-disable-next-line
    console.warn("Currently resolvable-if in `useBrick` is not supported.");
  } else if (!looseCheckIfByTransform(useBrick, data)) {
    return null;
  }

  return React.createElement(
    useBrick.brick,
    {
      ref: innerRefCallback,
    },
    ...slotsToChildren(
      useBrick.slots
    ).map((item: UseSingleBrickConf, index: number) => (
      <SingleBrickAsComponent key={index} useBrick={item} data={data} />
    ))
  );
});
