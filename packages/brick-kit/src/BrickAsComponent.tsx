import { set } from "lodash";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { isObject } from "@next-core/brick-utils";
import {
  UseBrickConf,
  UseSingleBrickConf,
  RuntimeBrickElement,
  BrickEventsMap,
  UseBrickSlotsConf,
  BrickConf,
  ProbablyRuntimeBrick,
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
  _internalApiLoadDynamicBricksInBrickConf,
  RuntimeBrickConfWithTplSymbols,
  symbolForTplContextId,
  symbolForRefForProxy,
  symbolForComputedPropsFromProxy,
} from "./core/exports";
import { handleHttpError } from "./handleHttpError";
import { transformProperties, doTransform } from "./transformProperties";
import { looseCheckIfByTransform } from "./checkIf";
import { isPreEvaluated } from "./internal/evaluate";
import { cloneDeepWithInjectedMark } from "./internal/injected";
import { expandCustomTemplate } from "./core/CustomTemplates";
import { LocationContext } from "./core/LocationContext";
import { getTagNameOfCustomTemplate } from "./core/CustomTemplates/getTagNameOfCustomTemplate";
import { handleProxyOfCustomTemplate } from "./core/CustomTemplates/handleProxyOfCustomTemplate";
import {
  listenOnTrackingContext,
  TrackingContextItem,
} from "./internal/listenOnTrackingContext";
import { getHistory } from "./history";
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
    const instance = LocationContext.getInstance(null, getHistory().location);

    const isBrickAvailable = React.useMemo(() => {
      if (isObject(useBrick.if) && !isPreEvaluated(useBrick.if)) {
        // eslint-disable-next-line
        console.warn("Currently resolvable-if in `useBrick` is not supported.");
      } else if (
        !looseCheckIfByTransform(useBrick, data, {
          allowInject: true,
          getTplVariables: () =>
            instance
              .getTplContext()
              .getContext(
                (useBrick as RuntimeBrickConfWithTplSymbols)[
                  symbolForTplContextId
                ]
              ),
        })
      ) {
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

      _internalApiLoadDynamicBricksInBrickConf(useBrick as BrickConf).catch(
        handleHttpError
      );

      const trackingContextList: TrackingContextItem[] = [];

      const transformOption: Record<string, any> = {
        // Keep lazy fields inside `useBrick` inside the `properties`.
        // They will be transformed by their `BrickAsComponent` later.
        $$lazyForUseBrick: true,
        trackingContextList,
        allowInject: true,
      };

      if ((useBrick as RuntimeBrickConfWithTplSymbols)[symbolForTplContextId]) {
        transformOption.getTplVariables = () =>
          instance
            .getTplContext()
            .getContext(
              (useBrick as RuntimeBrickConfWithTplSymbols)[
                symbolForTplContextId
              ]
            );
      }

      const brick: RuntimeBrick = {
        ...useBrick,
        type: useBrick.brick,
        // Now transform data in properties too.
        properties: doTransform(
          data,
          cloneDeepWithInjectedMark(useBrick.properties) || {},
          transformOption
        ),
      };

      const tplTagName = getTagNameOfCustomTemplate(
        useBrick.brick,
        _internalApiGetCurrentContext().app?.id
      );
      if (tplTagName) {
        // 如果是模板, 需要展开解析模板, 并遍历模板中的slots, 再给slots的brick绑定值给自身
        // 为后续ProxyRefs获取brick做值缓存
        const tplConf = {
          brick: tplTagName,
          properties: data as Record<string, unknown>,
          events: useBrick.events,
          lifeCycle: useBrick.lifeCycle,
        };
        const template = expandCustomTemplate(
          tplConf,
          brick,
          _internalApiGetCurrentContext(),
          instance.getTplContext()
        );
        slotsToChildren(template.slots as UseBrickSlotsConf).forEach((item) => {
          if (
            (item as RuntimeBrickConfWithTplSymbols)[symbolForRefForProxy] !==
            undefined
          ) {
            (item as RuntimeBrickConfWithTplSymbols)[
              symbolForRefForProxy
            ].brick = item as ProbablyRuntimeBrick;
          }
        });
      } else if (
        (useBrick as RuntimeBrickConfWithTplSymbols)[symbolForRefForProxy]
      ) {
        (useBrick as RuntimeBrickConfWithTplSymbols)[
          symbolForRefForProxy
        ].brick = brick;
      }

      // Let `transform` works still.
      transformProperties(
        brick.properties,
        data,
        useBrick.transform,
        useBrick.transformFrom,
        undefined,
        {
          allowInject: true,
        }
      );

      // 设置 properties refProperty值
      if (
        (useBrick as RuntimeBrickConfWithTplSymbols)[
          symbolForComputedPropsFromProxy
        ]
      ) {
        Object.entries(
          (useBrick as RuntimeBrickConfWithTplSymbols)[
            symbolForComputedPropsFromProxy
          ]
        ).forEach(([propName, propValue]) => {
          set(brick.properties, propName, propValue);
        });
      }

      const runtimeContext = _internalApiGetCurrentContext();

      if (useBrick.lifeCycle) {
        const resolver = _internalApiGetResolver();
        await resolver.resolve(
          {
            brick: useBrick.brick,
            lifeCycle: useBrick.lifeCycle,
          },
          brick,
          runtimeContext
        );
      }

      listenOnTrackingContext(brick, trackingContextList, runtimeContext);

      return brick;
    }, [useBrick, data, isBrickAvailable]);

    const innerRefCallback = React.useCallback(
      async (element: HTMLElement) => {
        immediatelyRefCallback?.(element);
        if (element) {
          let brick: RuntimeBrick;
          try {
            brick = await runtimeBrick;
          } catch (e) {
            handleHttpError(e);
          }
          // sub-brick rendering is ignored.
          if (!brick) {
            return;
          }
          brick.element = element;
          setRealProperties(element, brick.properties);
          unbindListeners(element);
          if (useBrick.events) {
            bindListeners(
              element,
              transformEvents(data, useBrick.events),
              _internalApiGetCurrentContext()
            );
          }

          // 设置proxyEvent
          handleProxyOfCustomTemplate(brick);
          // Memoize the parent ref of useBrick.
          (element as RuntimeBrickElementWithTplSymbols)[
            symbolForParentRefForUseBrickInPortal
          ] = parentRefForUseBrickInPortal;

          if ((element as RuntimeBrickElement).$$typeof !== "custom-template") {
            if (!useBrick.brick.includes("-")) {
              (element as RuntimeBrickElement).$$typeof = "native";
            } else if (!customElements.get(useBrick.brick)) {
              (element as RuntimeBrickElement).$$typeof = "invalid";
            }
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

    const tplTagName = getTagNameOfCustomTemplate(
      useBrick.brick,
      _internalApiGetCurrentContext().app?.id
    );

    if (tplTagName) {
      const tplConf = {
        brick: tplTagName,
        properties: (data as Record<string, unknown>) || useBrick.properties,
        events: useBrick.events,
        lifeCycle: useBrick.lifeCycle,
      };

      const proxyBrick: RuntimeBrick = {
        type: tplTagName,
        // Now transform data in properties too.
        properties: doTransform(
          data,
          cloneDeepWithInjectedMark(useBrick.properties) || {},
          {
            $$lazyForUseBrick: true,
            trackingContextList: [],
            allowInject: true,
          }
        ),
        events: isObject(useBrick.events) ? useBrick.events : {},
      };
      const template = expandCustomTemplate(
        tplConf,
        proxyBrick,
        _internalApiGetCurrentContext(),
        instance.getTplContext()
      );

      return React.createElement(
        template.brick,
        {
          ref: innerRefCallback,
        },
        ...slotsToChildren(template.slots as UseBrickSlotsConf).map(
          (item: UseSingleBrickConf, index: number) => {
            const templateItem = {
              ...proxyBrick,
              ...item,
            };
            return (
              <SingleBrickAsComponent
                key={index}
                useBrick={templateItem}
                data={data}
              />
            );
          }
        ),
        ...slotsToChildren(useBrick.slots as UseBrickSlotsConf).map(
          (item: UseSingleBrickConf, index: number) => {
            const templateItem = {
              ...proxyBrick,
              ...item,
            };
            return (
              <SingleBrickAsComponent
                key={index}
                useBrick={templateItem}
                data={data}
              />
            );
          }
        )
      );
    } else {
      return React.createElement(
        useBrick.brick,
        {
          ref: innerRefCallback,
        },
        ...slotsToChildren(useBrick.slots).map(
          (item: UseSingleBrickConf, index: number) => {
            if (
              (useBrick as RuntimeBrickConfWithTplSymbols)[
                symbolForTplContextId
              ] &&
              !(item as RuntimeBrickConfWithTplSymbols)[symbolForTplContextId]
            ) {
              (item as RuntimeBrickConfWithTplSymbols)[symbolForTplContextId] =
                (useBrick as RuntimeBrickConfWithTplSymbols)[
                  symbolForTplContextId
                ];
            }
            return (
              <SingleBrickAsComponent key={index} useBrick={item} data={data} />
            );
          }
        )
      );
    }
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
        } else if (
          !looseCheckIfByTransform(useBrick, data, { allowInject: true })
        ) {
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

        _internalApiLoadDynamicBricksInBrickConf(useBrick as BrickConf).catch(
          handleHttpError
        );

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
              allowInject: true,
            }
          ),
        };
        // Let `transform` works still.
        transformProperties(
          brick.properties,
          data,
          useBrick.transform,
          useBrick.transformFrom,
          undefined,
          {
            allowInject: true,
          }
        );

        const runtimeContext = _internalApiGetCurrentContext();

        if (useBrick.lifeCycle) {
          const resolver = _internalApiGetResolver();
          await resolver.resolve(
            {
              brick: useBrick.brick,
              lifeCycle: useBrick.lifeCycle,
            },
            brick,
            runtimeContext
          );
        }

        listenOnTrackingContext(brick, trackingContextList, runtimeContext);

        return brick;
      }, [useBrick, data, isBrickAvailable]);

      const innerRefCallback = React.useCallback(
        async (element: HTMLElement) => {
          brickRef.current = element;

          if (element) {
            let brick: RuntimeBrick;
            try {
              brick = await runtimeBrick;
            } catch (e) {
              handleHttpError(e);
            }
            // sub-brick rendering is ignored.
            if (!brick) {
              return;
            }
            brick.element = element;
            setRealProperties(element, brick.properties);
            unbindListeners(element);
            if (useBrick.events) {
              bindListeners(
                element,
                transformEvents(data, useBrick.events),
                _internalApiGetCurrentContext()
              );
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
