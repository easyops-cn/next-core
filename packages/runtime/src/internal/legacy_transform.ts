import { get, set } from "lodash";
import { _internalApiGetRuntimeContext } from "./Runtime.js";
import { computeRealValue } from "./compute/computeRealValue.js";
import {
  getV2RuntimeFromDll,
  type LegacyGeneralTransform,
  type LegacyTransformMap,
} from "../getV2RuntimeFromDll.js";

/** For v2 compatibility of `doTransform` from brick-kit. */
export function legacyDoTransform(
  data: unknown,
  to: unknown,
  options?: unknown
) {
  const v2Kit = getV2RuntimeFromDll();
  if (v2Kit) {
    return v2Kit.doTransform(data, to, options);
  }
  if (options) {
    throw new Error("Legacy doTransform does not support options in v3");
  }
  return computeRealValue(
    to,
    {
      ..._internalApiGetRuntimeContext()!,
      data,
    },
    {
      noInject: true,
    }
  );
}

/** For v2 compatibility of `transformProperties` from brick-kit. */
export function legacyTransformProperties(
  props: Record<string, unknown>,
  data: unknown,
  to: LegacyGeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto",
  options?: unknown
): Record<string, unknown> {
  const v2Kit = getV2RuntimeFromDll();
  if (v2Kit) {
    return v2Kit.transformProperties(props, data, to, from, mapArray, options);
  }
  if (options) {
    throw new Error(
      "Legacy transformProperties does not support options in v3"
    );
  }

  const result = preprocessTransformProperties(data, to, from, mapArray);
  for (const [propName, propValue] of Object.entries(result)) {
    set(props, propName, propValue);
  }
  return props;
}

/** For v2 compatibility of `transformIntermediateData` from brick-kit. */
export function legacyTransformIntermediateData(
  data: unknown,
  to: LegacyGeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto"
): unknown {
  const intermediateData = from ? get(data, from) : data;
  if (!to) {
    return intermediateData;
  }
  return legacyTransformProperties(
    {},
    intermediateData,
    to,
    undefined,
    mapArray
  );
}

function preprocessTransformProperties(
  data: unknown,
  to: LegacyGeneralTransform,
  from?: string | string[],
  mapArray?: boolean | "auto"
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
        item.mapArray
      );
    }
  } else {
    pipeableTransform(props, processedData, to, undefined, mapArray);
  }
  return props;
}

function pipeableTransform(
  props: Record<string, unknown>,
  data: unknown,
  to: string | LegacyTransformMap | null | undefined,
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
      ? (fromData as unknown[]).map((item) =>
          legacyDoTransform(item, transformTo)
        )
      : legacyDoTransform(fromData, transformTo);
  }
}
