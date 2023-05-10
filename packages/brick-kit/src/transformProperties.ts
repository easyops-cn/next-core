import { get, set } from "lodash";
import { GeneralTransform, TransformMap } from "@next-core/brick-types";
import {
  isObject,
  transform,
  isEvaluable,
  transformAndInject,
} from "@next-core/brick-utils";
import {
  evaluate,
  EvaluateOptions,
  isPreEvaluated,
  shouldDismissRecursiveMarkingInjected,
  EvaluateRuntimeContext,
  getPreEvaluatedRaw,
  addDataToPreEvaluated,
  PreEvaluated,
} from "./internal/evaluate";
import { haveBeenInjected, recursiveMarkAsInjected } from "./internal/injected";
import { devtoolsHookEmit } from "./internal/devtools";
import { setRealProperties } from "./internal/setProperties";
import {
  getNextStateOfUseBrick,
  isLazyContentInUseBrick,
  StateOfUseBrick,
} from "./internal/getNextStateOfUseBrick";
import { TrackingContextItem } from "./internal/listenOnTrackingContext";
import { _internalApiGetCurrentContext } from "./core/Runtime";
import { getTracks } from "./internal/getTracks";

interface TransformOptions {
  isReTransformation?: boolean;
  transformationId?: number;
  allowInject?: boolean;
}

export interface DoTransformOptions {
  evaluateOptions?: EvaluateOptions;
  trackingContextList?: TrackingContextItem[];
  allowInject?: boolean;
  tplContextId?: string;
  formContextId?: string;
  $$lazyForUseBrick?: boolean;
  $$stateOfUseBrick?: StateOfUseBrick;
}

/** @internal */
export function transformElementProperties(
  element: HTMLElement,
  data: unknown,
  to: GeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto"
): void {
  const result = preprocessTransformProperties(data, to, from, mapArray);
  setRealProperties(element, result, true);
}

/** @internal */
export function transformProperties(
  props: Record<string, unknown>,
  data: unknown,
  to: GeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto",
  options?: {
    allowInject?: boolean;
  }
): Record<string, unknown> {
  const result = preprocessTransformProperties(
    data,
    to,
    from,
    mapArray,
    options
  );
  for (const [propName, propValue] of Object.entries(result)) {
    set(props, propName, propValue);
  }
  return props;
}

/** @internal */
export function doTransform(
  data: unknown,
  to: unknown,
  options?: DoTransformOptions
): unknown {
  const preEvaluated = isPreEvaluated(to);
  if (preEvaluated || typeof to === "string") {
    // For `useBrick`, some fields such as `properties`/`transform`/`events`,
    // are kept and to be transformed later.
    const lazy =
      options?.$$lazyForUseBrick &&
      isLazyContentInUseBrick(options.$$stateOfUseBrick);
    if (lazy) {
      // The current data context is not memoized, since a new data context
      // should always be provided before later transformations.
      return to;
    }

    let result: unknown;
    let dismissRecursiveMarkingInjected = false;
    if (preEvaluated || isEvaluable(to as string)) {
      const runtimeContext: EvaluateRuntimeContext = {
        data,
      };
      if (options?.tplContextId)
        runtimeContext.tplContextId = options.tplContextId;
      if (options?.formContextId)
        runtimeContext.formContextId = options.formContextId;
      result = evaluate(to as string, runtimeContext, options?.evaluateOptions);
      dismissRecursiveMarkingInjected = shouldDismissRecursiveMarkingInjected(
        to as string
      );
    } else {
      result = options?.allowInject
        ? transformAndInject(
            to as string,
            data,
            _internalApiGetCurrentContext()
          )
        : transform(to as string, data);
    }
    if (!dismissRecursiveMarkingInjected) {
      recursiveMarkAsInjected(result);
    }
    return result;
  }

  if (!isObject(to) || haveBeenInjected(to)) {
    return to;
  }

  if (Array.isArray(to)) {
    const nextOptions = getNextDoTransformOptions(options, true);
    return to.map((item) => doTransform(data, item, nextOptions));
  }

  return Object.fromEntries(
    // Get both string and symbol keys.
    Object.entries(to)
      .map(([k, v]) => {
        if (Array.isArray(options?.trackingContextList)) {
          let raw: string;
          if (typeof v === "string") {
            raw = v;
          } else {
            raw = getPreEvaluatedRaw(v as PreEvaluated);
            addDataToPreEvaluated(v, data);
          }
          const { contextNames, stateNames, formStateNames } = getTracks(raw);
          if (contextNames || stateNames || formStateNames) {
            options.trackingContextList.push({
              contextNames,
              stateNames,
              formStateNames,
              propName: k,
              propValue: v,
            });
          }
        }
        return [
          k,
          doTransform(data, v, getNextDoTransformOptions(options, false, k)),
        ];
      })
      .concat(
        Object.getOwnPropertySymbols(to).map((k) => [
          k,
          (to as Record<string | symbol, unknown>)[k],
        ])
      )
  );
}

/** @internal */
export function reTransformForDevtools(
  transformationId: number,
  data: unknown,
  to: GeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto",
  allowInject?: boolean
): void {
  try {
    preprocessTransformProperties(data, to, from, mapArray, {
      isReTransformation: true,
      transformationId,
      allowInject,
    });
  } catch (error) {
    devtoolsHookEmit("re-transformation", {
      id: transformationId,
      error: error.message,
      detail: {
        transform: to,
        data,
        options: { from, mapArray, allowInject },
      },
    });
  }
}

/** @internal */
export function preprocessTransformProperties(
  data: unknown,
  to: GeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto",
  options?: TransformOptions
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const processedData = from ? get(data, from) : data;

  if (Array.isArray(to)) {
    for (const item of to) {
      pipeableTransform(
        props,
        processedData,
        item.to,
        item.from,
        item.mapArray,
        {
          allowInject: options?.allowInject,
        }
      );
    }
  } else {
    pipeableTransform(props, processedData, to, undefined, mapArray, {
      allowInject: options?.allowInject,
    });
  }
  const detail = {
    transform: to,
    data,
    options: { from, mapArray, allowInject: options?.allowInject },
    result: props,
  };
  if (options?.isReTransformation) {
    devtoolsHookEmit("re-transformation", {
      id: options.transformationId,
      detail,
    });
  } else {
    devtoolsHookEmit("transformation", detail);
  }
  return props;
}

function pipeableTransform(
  props: Record<string, unknown>,
  data: unknown,
  to: string | TransformMap,
  from?: string | string[],
  mapArray?: boolean | "auto",
  options?: {
    allowInject?: boolean;
  }
): void {
  if (!to) {
    // Do nothing if `to` is falsy.
    return;
  }

  let fromData = from ? get(data, from) : data;

  let isArray = Array.isArray(fromData);
  if (!isArray && mapArray === true) {
    isArray = true;
    fromData = [fromData];
  } else if (isArray && mapArray === false) {
    isArray = false;
  }

  if (typeof to === "string") {
    props[to] = fromData;
    return;
  }

  for (const [transformedPropName, transformTo] of Object.entries(to)) {
    // If `fromData` is an array, mapping it's items.
    props[transformedPropName] = isArray
      ? (fromData as unknown[]).map((item) =>
          doTransform(item, transformTo, options)
        )
      : doTransform(fromData, transformTo, options);
  }
}

/** @internal */
export function transformIntermediateData(
  data: unknown,
  to: GeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto"
): unknown {
  const intermediateData = from ? get(data, from) : data;
  if (!to) {
    return intermediateData;
  }
  return transformProperties({}, intermediateData, to, undefined, mapArray);
}

function getNextDoTransformOptions(
  options: DoTransformOptions,
  isArray: boolean,
  key?: string
): DoTransformOptions {
  return options
    ? {
        ...options,
        // Collect tracking context in first level only.
        trackingContextList: undefined,
        $$stateOfUseBrick: options.$$lazyForUseBrick
          ? getNextStateOfUseBrick(
              options.$$stateOfUseBrick ?? StateOfUseBrick.INITIAL,
              isArray,
              key
            )
          : undefined,
      }
    : options;
}
