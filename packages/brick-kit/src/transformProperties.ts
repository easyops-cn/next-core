import { get, set } from "lodash";
import { GeneralTransform, TransformMap } from "@easyops/brick-types";
import { isObject, transform, isEvaluable } from "@easyops/brick-utils";
import { evaluate, EvaluateOptions } from "./evaluate";
import { haveBeenInjected, recursiveMarkAsInjected } from "./injected";
import { devtoolsHookEmit } from "./devtools";
import { setRealProperties } from "./setProperties";

interface TransformOptions {
  isReTransformation?: boolean;
  transformationId?: number;
}

export function transformElementProperties(
  element: HTMLElement,
  data: any,
  to: GeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto"
): void {
  const result = preprocessTransformProperties(data, to, from, mapArray);
  setRealProperties(element, result, true);
}

export function transformProperties(
  props: Record<string, any>,
  data: any,
  to: GeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto"
): Record<string, any> {
  const result = preprocessTransformProperties(data, to, from, mapArray);
  for (const [propName, propValue] of Object.entries(result)) {
    set(props, propName, propValue);
  }
  return props;
}

export function doTransform(
  data: any,
  to: any,
  options?: {
    evaluateOptions?: EvaluateOptions;
  }
): any {
  if (typeof to === "string") {
    let result: any;
    if (isEvaluable(to)) {
      result = evaluate(to, { data }, options?.evaluateOptions);
    } else {
      result = transform(to, data);
    }
    recursiveMarkAsInjected(result);
    return result;
  }

  if (isObject(to) && haveBeenInjected(to)) {
    return to;
  }

  return Array.isArray(to)
    ? to.map((item) => doTransform(data, item, options))
    : isObject(to)
    ? Object.fromEntries(
        Object.entries(to).map((entry) => [
          entry[0],
          doTransform(data, entry[1], options),
        ])
      )
    : to;
}

export function reTransformForDevtools(
  transformationId: number,
  data: any,
  to: GeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto"
): void {
  try {
    preprocessTransformProperties(data, to, from, mapArray, {
      isReTransformation: true,
      transformationId,
    });
  } catch (error) {
    devtoolsHookEmit("re-transformation", {
      id: transformationId,
      error: error.message,
      detail: {
        transform: to,
        data,
        options: { from, mapArray },
      },
    });
  }
}

export function preprocessTransformProperties(
  data: any,
  to: GeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto",
  options?: TransformOptions
): Record<string, any> {
  const props: Record<string, any> = {};
  const processedData = from ? get(data, from) : data;

  if (Array.isArray(to)) {
    for (const item of to) {
      pipeableTransform(
        props,
        processedData,
        item.to,
        item.from,
        item.mapArray
      );
    }
  } else {
    pipeableTransform(props, processedData, to, undefined, mapArray);
  }
  const detail = {
    transform: to,
    data,
    options: { from, mapArray },
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
  props: Record<string, any>,
  data: any,
  to: string | TransformMap,
  from?: string | string[],
  mapArray?: boolean | "auto"
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
      ? (fromData as any[]).map((item) => doTransform(item, transformTo))
      : doTransform(fromData, transformTo);
  }
}

export function transformIntermediateData(
  data: any,
  to: GeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto"
): any {
  const intermediateData = from ? get(data, from) : data;
  if (!to) {
    return intermediateData;
  }
  return transformProperties({}, intermediateData, to, undefined, mapArray);
}
