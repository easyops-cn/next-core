import { set } from "lodash";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { isObject } from "@next-core/brick-utils";
import {
  UseBrickConf,
  UseSingleBrickConf,
  RuntimeBrickElement,
  BrickEventsMap,
  UseBrickSlotsConf,
  BrickConf,
  SlotsConf,
  BrickEventHandler,
  ContextConf,
} from "@next-core/brick-types";
import {
  bindListeners,
  listenerFactory,
  unbindListeners,
} from "./internal/bindListeners";
import { setRealProperties } from "./internal/setProperties";
import {
  RuntimeBrick,
  _internalApiGetCurrentContext,
  _internalApiGetResolver,
  _internalApiGetRouterState,
  _internalApiLoadDynamicBricksInBrickConf,
  RuntimeBrickConfWithTplSymbols,
  symbolForTplContextId,
  symbolForComputedPropsFromProxy,
  symbolForRefForProxy,
  expandCustomTemplate,
  getTagNameOfCustomTemplate,
  handleProxyOfCustomTemplate,
  asyncExpandCustomTemplate,
  customTemplateRegistry,
} from "./core/exports";
import { handleHttpError } from "./handleHttpError";
import {
  transformProperties,
  doTransform,
  DoTransformOptions,
} from "./transformProperties";
import { looseCheckIfByTransform } from "./checkIf";
import { isPreEvaluated } from "./internal/evaluate";
import { cloneDeepWithInjectedMark } from "./internal/injected";
import {
  listenOnTrackingContext,
  TrackingContextItem,
} from "./internal/listenOnTrackingContext";
import {
  AsyncExpandCustomForm,
  ExpandCustomForm,
  FormDataProperties,
} from "./core/CustomForms/ExpandCustomForm";
import {
  formRenderer,
  RuntimeBrickConfOfFormSymbols,
  RuntimeBrickConfWithFormSymbols,
  symbolForFormContextId,
} from "./core/CustomForms/constants";

interface BrickAsComponentProps {
  useBrick: UseBrickConf;
  data?: unknown;
  /**
   * @deprecated
   */
  parentRefForUseBrickInPortal?: React.RefObject<HTMLElement>;
}

interface SingleBrickAsComponentProps extends BrickAsComponentProps {
  useBrick: UseSingleBrickConf;
  refCallback?: (element: HTMLElement) => void;
  immediatelyRefCallback?: (element: HTMLElement) => void;
}

function expandTemplateInUseBrick(
  useBrick: UseSingleBrickConf,
  tplTagName: string | false,
  brick: RuntimeBrick,
  requireSuspense: boolean
): BrickConf | Promise<BrickConf> {
  if (tplTagName) {
    // 如果是模板, 需要展开解析模板, 并遍历模板中的slots, 再给slots的brick绑定值给自身
    // 为后续ProxyRefs获取brick做值缓存
    const tplConf: BrickConf = {
      brick: tplTagName,
      properties: brick.properties,
      events: useBrick.events,
      lifeCycle: useBrick.lifeCycle,
      slots: useBrick.slots as SlotsConf,
    };

    return (requireSuspense ? asyncExpandCustomTemplate : expandCustomTemplate)(
      tplConf,
      brick,
      _internalApiGetCurrentContext()
    );
  } else if (
    (useBrick as RuntimeBrickConfWithTplSymbols)[symbolForRefForProxy]
  ) {
    (useBrick as RuntimeBrickConfWithTplSymbols)[symbolForRefForProxy].brick =
      brick;
  }
}

const getCurrentRunTimeBrick = (
  useBrick: UseSingleBrickConf,
  tplTagName: string | false,
  data: unknown
): RuntimeBrick => {
  const trackingContextList: TrackingContextItem[] = [];
  const tplContextId = (useBrick as RuntimeBrickConfWithTplSymbols)[
    symbolForTplContextId
  ];
  const formContextId = (useBrick as RuntimeBrickConfOfFormSymbols)[
    symbolForFormContextId
  ];
  const transformOption: DoTransformOptions = {
    // Keep lazy fields inside `useBrick` inside the `properties`.
    // They will be transformed by their `BrickAsComponent` later.
    $$lazyForUseBrick: true,
    trackingContextList,
    allowInject: true,
    tplContextId,
    formContextId,
  };

  const properties = doTransform(
    data,
    cloneDeepWithInjectedMark(useBrick.properties) || {},
    transformOption
  );

  const brick: RuntimeBrick = {
    ...useBrick,
    type: tplTagName || useBrick.brick,
    // Now transform data in properties too.
    properties,
  };

  const runtimeContext = _internalApiGetCurrentContext();

  listenOnTrackingContext(brick, trackingContextList, {
    ...runtimeContext,
    tplContextId,
    formContextId,
  });

  return brick;
};

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
    refCallback,
    immediatelyRefCallback,
  }: SingleBrickAsComponentProps): React.ReactElement {
    const firstRunRef = useRef(true);
    const innerRefCallbackRef = useRef<(element: HTMLElement) => void>();
    const elementRef = useRef<HTMLElement>();
    const expandedBrickConfRef = useRef<BrickConf>();
    const [expandedBrickConf, setExpandedBrickConf] = useState<BrickConf>(null);
    const tplTagName = getTagNameOfCustomTemplate(
      useBrick.brick,
      _internalApiGetCurrentContext().app?.id
    );
    const isBrickAvailable = useMemo(() => {
      if (isObject(useBrick.if) && !isPreEvaluated(useBrick.if)) {
        // eslint-disable-next-line
        console.warn("Currently resolvable-if in `useBrick` is not supported.");
      } else if (
        !looseCheckIfByTransform(useBrick, data, {
          allowInject: true,
          // useBrick 中嵌套custom-template的情况下, 会存在丢失getTplVariables的情况, 因此需要在此进行补充
          tplContextId: (useBrick as RuntimeBrickConfWithTplSymbols)[
            symbolForTplContextId
          ],
        })
      ) {
        return false;
      }

      return true;
    }, [useBrick, data]);

    const requireSuspense = useMemo(() => {
      let context: ContextConf[];
      if (useBrick.brick === formRenderer) {
        const formData =
          typeof useBrick.properties.formData === "string"
            ? JSON.parse(useBrick.properties.formData)
            : useBrick.properties.formData;
        context = (formData as FormDataProperties).context;
      } else if (tplTagName) {
        context = customTemplateRegistry.get(tplTagName).state;
      }
      return Array.isArray(context) && context.some((ctx) => !!ctx.resolve);
    }, [tplTagName, useBrick]);
    const [suspenseReady, setSuspenseReady] = useState(false);

    const runtimeBrick = useMemo(async () => {
      if (!isBrickAvailable) {
        return null;
      }

      // If the router state is initial, ignore rendering the sub-brick.
      if (
        _internalApiGetRouterState() === "initial" &&
        !window.DEVELOPER_PREVIEW
      ) {
        return;
      }

      _internalApiLoadDynamicBricksInBrickConf(useBrick as BrickConf).catch(
        handleHttpError
      );

      const brick = getCurrentRunTimeBrick(useBrick, tplTagName, data);
      const expanded =
        useBrick.brick === formRenderer
          ? (requireSuspense ? AsyncExpandCustomForm : ExpandCustomForm)(
              typeof useBrick.properties.formData === "string"
                ? JSON.parse(useBrick.properties.formData)
                : useBrick.properties.formData,
              useBrick as BrickConf,
              false
            )
          : expandTemplateInUseBrick(
              useBrick,
              tplTagName,
              brick,
              requireSuspense
            );
      if (requireSuspense) {
        setExpandedBrickConf(await expanded);
        setSuspenseReady(true);
      } else {
        expandedBrickConfRef.current = expanded as BrickConf;
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

      if (useBrick.lifeCycle) {
        const resolver = _internalApiGetResolver();
        await resolver.resolve(
          {
            brick: useBrick.brick,
            lifeCycle: useBrick.lifeCycle,
          },
          brick,
          {
            ..._internalApiGetCurrentContext(),
            tplContextId: (useBrick as RuntimeBrickConfWithTplSymbols)[
              symbolForTplContextId
            ],
            formContextId: (useBrick as RuntimeBrickConfWithFormSymbols)[
              symbolForFormContextId
            ],
          }
        );
      }

      return brick;
    }, [useBrick, data, isBrickAvailable, tplTagName, requireSuspense]);

    const dispatchLifeCycleEvent = async (
      event: CustomEvent,
      handlers: BrickEventHandler | BrickEventHandler[],
      brick: RuntimeBrick
    ): Promise<void> => {
      for (const handler of ([] as BrickEventHandler[]).concat(handlers)) {
        listenerFactory(
          handler,
          {
            ..._internalApiGetCurrentContext(),
            tplContextId: (useBrick as RuntimeBrickConfWithTplSymbols)[
              symbolForTplContextId
            ],
            formContextId: (useBrick as RuntimeBrickConfWithFormSymbols)[
              symbolForFormContextId
            ],
          },
          brick
        )(event);
      }
    };

    const updateBrick = useCallback(
      (brick: RuntimeBrick, element: HTMLElement): void => {
        brick.element = element;

        const { [symbolForTplContextId]: tplContextId } =
          useBrick as RuntimeBrickConfWithTplSymbols;
        const { [symbolForFormContextId]: formContextId } =
          useBrick as RuntimeBrickConfWithFormSymbols;
        if (useBrick.iid) {
          element.dataset.iid = useBrick.iid;
        }
        setRealProperties(element, brick.properties);
        unbindListeners(element);
        if (brick.events) {
          bindListeners(element, transformEvents(data, brick.events), {
            ..._internalApiGetCurrentContext(),
            tplContextId,
            formContextId,
          });
        }
        // 设置proxyEvent
        handleProxyOfCustomTemplate(brick);

        if (
          !["formRenderer", "custom-template"].includes(
            (element as RuntimeBrickElement).$$typeof
          )
        ) {
          if (!useBrick.brick.includes("-")) {
            (element as RuntimeBrickElement).$$typeof = "native";
          } else if (!customElements.get(useBrick.brick)) {
            (element as RuntimeBrickElement).$$typeof = "invalid";
          }
        }
      },
      [data, useBrick]
    );

    useEffect(() => {
      if (firstRunRef.current) {
        firstRunRef.current = false;
        return;
      }

      (async () => {
        const element = elementRef.current;
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

          updateBrick(brick, element);
        }
      })();
    }, [runtimeBrick, updateBrick]);

    innerRefCallbackRef.current = async (element: HTMLElement) => {
      immediatelyRefCallback?.(element);
      elementRef.current = element;

      let brick: RuntimeBrick;
      try {
        brick = await runtimeBrick;
      } catch (e) {
        handleHttpError(e);
      }
      // sub-brick rendering is ignored.
      if (brick) {
        if (element) {
          updateBrick(brick, element);

          if (useBrick.lifeCycle?.onMount) {
            dispatchLifeCycleEvent(
              new CustomEvent("mount"),
              useBrick.lifeCycle.onMount,
              brick
            );
          }
        } else {
          if (useBrick.lifeCycle?.onUnmount) {
            dispatchLifeCycleEvent(
              new CustomEvent("unmount"),
              useBrick.lifeCycle.onUnmount,
              brick
            );
          }
        }
      }

      refCallback?.(element);
    };

    // ref https://reactjs.org/docs/refs-and-the-dom.html#caveats-with-callback-refs
    const innerRefCallback = React.useCallback((element: HTMLElement) => {
      innerRefCallbackRef.current(element);
    }, []);

    const childConfs = useMemo(
      () =>
        slotsToChildren(
          (
            (requireSuspense
              ? expandedBrickConf
              : expandedBrickConfRef.current) ?? useBrick
          ).slots as UseBrickSlotsConf
        ),
      [
        expandedBrickConf,
        expandedBrickConfRef.current,
        useBrick,
        requireSuspense,
      ]
    );

    if (!isBrickAvailable || (requireSuspense && !suspenseReady)) {
      return null;
    }

    return React.createElement(
      (requireSuspense ? expandedBrickConf : expandedBrickConfRef.current)
        ?.brick ??
        (tplTagName || useBrick.brick),
      {
        ref: innerRefCallback,
      },
      ...childConfs.map((item: UseSingleBrickConf, index: number) => (
        <SingleBrickAsComponent key={index} useBrick={item} data={data} />
      ))
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
 * />
 * ```
 *
 * @param props - 属性。
 */
export function BrickAsComponent({
  useBrick,
  data,
}: BrickAsComponentProps): React.ReactElement {
  if (Array.isArray(useBrick)) {
    return (
      <>
        {useBrick.map((item, index) => (
          <SingleBrickAsComponent key={index} useBrick={item} data={data} />
        ))}
      </>
    );
  }
  return <SingleBrickAsComponent useBrick={useBrick} data={data} />;
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
      { useBrick, data, refCallback }: SingleBrickAsComponentProps,
      ref
    ): React.ReactElement {
      const firstRunRef = useRef(true);
      const innerRefCallbackRef = useRef<(element: HTMLElement) => void>();
      const elementRef = useRef<HTMLElement>();
      const expandedBrickConfRef = useRef<BrickConf>();
      const [expandedBrickConf, setExpandedBrickConf] =
        useState<BrickConf>(null);
      const tplTagName = getTagNameOfCustomTemplate(
        useBrick.brick,
        _internalApiGetCurrentContext().app?.id
      );
      const isBrickAvailable = React.useMemo(() => {
        if (isObject(useBrick.if) && !isPreEvaluated(useBrick.if)) {
          // eslint-disable-next-line
          console.warn(
            "Currently resolvable-if in `useBrick` is not supported."
          );
        } else if (
          !looseCheckIfByTransform(useBrick, data, {
            allowInject: true,
            // useBrick 中嵌套custom-template的情况下, 会存在丢失getTplVariables的情况, 因此需要在此进行补充
            tplContextId: (useBrick as RuntimeBrickConfWithTplSymbols)[
              symbolForTplContextId
            ],
          })
        ) {
          return false;
        }

        return true;
      }, [useBrick, data]);

      const requireSuspense = useMemo(() => {
        let context: ContextConf[];
        if (useBrick.brick === formRenderer) {
          const formData =
            typeof useBrick.properties.formData === "string"
              ? JSON.parse(useBrick.properties.formData)
              : useBrick.properties.formData;
          context = (formData as FormDataProperties).context;
        } else if (tplTagName) {
          context = customTemplateRegistry.get(tplTagName).state;
        }
        return Array.isArray(context) && context.some((ctx) => !!ctx.resolve);
      }, [tplTagName, useBrick]);
      const [suspenseReady, setSuspenseReady] = useState(false);

      /* istanbul ignore next (never reach in test) */
      useImperativeHandle(ref, () => {
        return elementRef.current;
      });

      const runtimeBrick = React.useMemo(async () => {
        if (!isBrickAvailable) {
          return null;
        }

        // If the router state is initial, ignore rendering the sub-brick.
        if (
          _internalApiGetRouterState() === "initial" &&
          !window.DEVELOPER_PREVIEW
        ) {
          return;
        }

        _internalApiLoadDynamicBricksInBrickConf(useBrick as BrickConf).catch(
          handleHttpError
        );

        const brick = getCurrentRunTimeBrick(useBrick, tplTagName, data);
        const expanded =
          useBrick.brick === formRenderer
            ? (requireSuspense ? AsyncExpandCustomForm : ExpandCustomForm)(
                typeof useBrick.properties.formData === "string"
                  ? JSON.parse(useBrick.properties.formData)
                  : useBrick.properties.formData,
                useBrick as BrickConf,
                false
              )
            : expandTemplateInUseBrick(
                useBrick,
                tplTagName,
                brick,
                requireSuspense
              );
        if (requireSuspense) {
          setExpandedBrickConf(await expanded);
          setSuspenseReady(true);
        } else {
          expandedBrickConfRef.current = expanded as BrickConf;
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

        if (useBrick.lifeCycle) {
          const resolver = _internalApiGetResolver();
          await resolver.resolve(
            {
              brick: useBrick.brick,
              lifeCycle: useBrick.lifeCycle,
            },
            brick,
            {
              ..._internalApiGetCurrentContext(),
              tplContextId: (useBrick as RuntimeBrickConfWithTplSymbols)[
                symbolForTplContextId
              ],
            }
          );
        }

        return brick;
      }, [useBrick, data, isBrickAvailable, tplTagName, requireSuspense]);

      const dispatchLifeCycleEvent = async (
        event: CustomEvent,
        handlers: BrickEventHandler | BrickEventHandler[],
        brick: RuntimeBrick
      ): Promise<void> => {
        for (const handler of ([] as BrickEventHandler[]).concat(handlers)) {
          listenerFactory(
            handler,
            {
              ..._internalApiGetCurrentContext(),
              tplContextId: (useBrick as RuntimeBrickConfWithTplSymbols)[
                symbolForTplContextId
              ],
            },
            brick
          )(event);
        }
      };

      const updateBrick = useCallback(
        (brick: RuntimeBrick, element: HTMLElement): void => {
          brick.element = element;

          const { [symbolForTplContextId]: tplContextId } =
            useBrick as RuntimeBrickConfWithTplSymbols;

          if (useBrick.iid) {
            element.dataset.iid = useBrick.iid;
          }
          setRealProperties(element, brick.properties);
          unbindListeners(element);
          if (useBrick.events) {
            bindListeners(element, transformEvents(data, useBrick.events), {
              ..._internalApiGetCurrentContext(),
              tplContextId,
            });
          }
          // 设置proxyEvent
          handleProxyOfCustomTemplate(brick);

          if ((element as RuntimeBrickElement).$$typeof !== "custom-template") {
            if (!useBrick.brick.includes("-")) {
              (element as RuntimeBrickElement).$$typeof = "native";
            } else if (!customElements.get(useBrick.brick)) {
              (element as RuntimeBrickElement).$$typeof = "invalid";
            }
          }
        },
        [data, useBrick]
      );

      useEffect(() => {
        if (firstRunRef.current) {
          firstRunRef.current = false;
          return;
        }

        (async () => {
          const element = elementRef.current;
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

            updateBrick(brick, element);
          }
        })();
      }, [runtimeBrick, updateBrick]);

      innerRefCallbackRef.current = async (element: HTMLElement) => {
        elementRef.current = element;

        let brick: RuntimeBrick;
        try {
          brick = await runtimeBrick;
        } catch (e) {
          handleHttpError(e);
        }
        // sub-brick rendering is ignored.
        if (brick) {
          if (element) {
            updateBrick(brick, element);

            if (useBrick.lifeCycle?.onMount) {
              dispatchLifeCycleEvent(
                new CustomEvent("mount"),
                useBrick.lifeCycle.onMount,
                brick
              );
            }
          } else {
            if (useBrick.lifeCycle?.onUnmount) {
              dispatchLifeCycleEvent(
                new CustomEvent("unmount"),
                useBrick.lifeCycle.onUnmount,
                brick
              );
            }
          }
        }

        refCallback?.(element);
      };

      // ref https://reactjs.org/docs/refs-and-the-dom.html#caveats-with-callback-refs
      const innerRefCallback = React.useCallback((element: HTMLElement) => {
        innerRefCallbackRef.current(element);
      }, []);

      const childConfs = useMemo(
        () =>
          slotsToChildren(
            (
              (requireSuspense
                ? expandedBrickConf
                : expandedBrickConfRef.current) ?? useBrick
            ).slots as UseBrickSlotsConf
          ),
        [
          expandedBrickConf,
          expandedBrickConfRef.current,
          useBrick,
          requireSuspense,
        ]
      );

      if (!isBrickAvailable || (requireSuspense && !suspenseReady)) {
        return null;
      }

      return React.createElement(
        (requireSuspense ? expandedBrickConf : expandedBrickConfRef.current)
          ?.brick ??
          (tplTagName || useBrick.brick),
        {
          ref: innerRefCallback,
        },
        ...childConfs.map((item: UseSingleBrickConf, index: number) => (
          <SingleBrickAsComponent key={index} useBrick={item} data={data} />
        ))
      );
    }
  )
);
