import { get, set } from "lodash";
import { GeneralTransform, TransformMap } from "@easyops/brick-types";
import { isObject, transform } from "@easyops/brick-utils";
import { isCookable, evaluate, EvaluateOptions } from "./evaluate";
import { haveBeenInjected, recursiveMarkAsInjected } from "./injected";
import { devtoolsHookEmit } from "./devtools";
import { setRealProperties } from "./setProperties";

export function transformElementProperties(
  element: HTMLElement,
  data: any,
  to: GeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto"
): void {
  const result = preprocessTransformProperties(
    from ? get(data, from) : data,
    to,
    mapArray
  );
  devtoolsHookEmit("transformation", {
    transform: to,
    data,
    options: { from, mapArray },
    result,
  });
  setRealProperties(element, result, true);
}

export function transformProperties(
  props: Record<string, any>,
  data: any,
  to: GeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto"
): Record<string, any> {
  const result = preprocessTransformProperties(
    from ? get(data, from) : data,
    to,
    mapArray
  );
  devtoolsHookEmit("transformation", {
    transform: to,
    data,
    options: { from, mapArray },
    result,
  });
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
    if (isCookable(to)) {
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

function preprocessTransformProperties(
  data: any,
  to: GeneralTransform,
  mapArray?: boolean | "auto"
): Record<string, any> {
  const props: Record<string, any> = {};
  if (Array.isArray(to)) {
    for (const item of to) {
      pipeableTransform(props, data, item.to, item.from, item.mapArray);
    }
  } else {
    pipeableTransform(props, data, to, undefined, mapArray);
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
