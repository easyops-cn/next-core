import {
  BrickConfInTemplate,
  PluginRuntimeContext,
} from "@easyops/brick-types";
import { isObject } from "@easyops/brick-utils";
import { clamp } from "lodash";
import { computeRealValue } from "../setProperties";
import {
  MergeablePropertyProxy,
  MergeablePropertyProxyOfArray,
  MergeBase,
} from "./internalInterfaces";

export function propertyMerge(
  conf: MergeablePropertyProxy,
  value: unknown,
  object: Record<string, unknown>
): unknown {
  return propertyMergeAll(
    conf.$$mergeBase,
    Object.fromEntries(
      conf.$$mergeBase.proxies.map((proxy) => [
        proxy.$$reversedRef,
        proxy === conf ? value : object[proxy.$$reversedRef],
      ])
    )
  );
}

export function propertyMergeAll(
  mergeBase: MergeBase,
  object: Record<string, unknown>
): unknown {
  if (mergeBase.mergeType === "array") {
    return propertyMergeAllOfArray(mergeBase, object);
  }
  if (mergeBase.mergeType === "object") {
    return propertyMergeAllOfObject(mergeBase, object);
  }
  // istanbul ignore next: should never reach
  throw new TypeError(`unsupported mergeType: "${mergeBase.mergeType}"`);
}

export function collectMergeBases(
  conf: MergeablePropertyProxy,
  mergeBases: Map<string, Map<string, MergeBase>>,
  context: PluginRuntimeContext,
  refToBrickConf: Map<string, BrickConfInTemplate>
): void {
  let mergeBaseMap: Map<string, MergeBase>;
  if (mergeBases.has(conf.ref)) {
    mergeBaseMap = mergeBases.get(conf.ref);
  } else {
    mergeBaseMap = new Map();
    mergeBases.set(conf.ref, mergeBaseMap);
  }

  if (mergeBaseMap.has(conf.mergeProperty)) {
    conf.$$mergeBase = mergeBaseMap.get(conf.mergeProperty);
    // istanbul ignore if: should never reach
    if (conf.mergeType !== conf.$$mergeBase.mergeType) {
      throw new Error(
        `Properties proxy contained different mergeTypes of "${conf.$$mergeBase.mergeType}" and "${conf.mergeType}"`
      );
    }
    conf.$$mergeBase.proxies.push(conf);
  } else {
    const baseValue = refToBrickConf.get(conf.ref).properties?.[
      conf.mergeProperty
    ];
    let computedBaseValue: unknown;
    switch (conf.mergeType) {
      case "array":
        // If the merge base is not array, replace it with an empty array.
        computedBaseValue = Object.freeze(
          Array.isArray(baseValue)
            ? computeRealValue(baseValue, context, true)
            : []
        );
        break;
      case "object":
        // If the merge base is not object, replace it with an empty object.
        computedBaseValue = Object.freeze(
          isObject(baseValue) ? computeRealValue(baseValue, context, true) : {}
        );
        break;
      // istanbul ignore next: should never reach
      default:
        throw new TypeError(
          `unsupported mergeType: "${
            (conf as MergeablePropertyProxy).mergeType
          }"`
        );
    }
    conf.$$mergeBase = {
      proxies: [conf],
      mergeType: conf.mergeType,
      baseValue: computedBaseValue,
    };
    mergeBaseMap.set(conf.mergeProperty, conf.$$mergeBase);
  }
}

function propertyMergeAllOfArray(
  mergeBase: MergeBase,
  object: Record<string, unknown>
): unknown[] {
  // Use an approach like template-literal's quasis:
  // `quasi0${0}quais1${1}quasi2...`
  // Every quasi can be merged with multiple items.
  const baseValue = mergeBase.baseValue as unknown[];
  const quasis: unknown[][] = [];
  const size = baseValue.length + 1;
  for (let i = 0; i < size; i += 1) {
    quasis.push([]);
  }

  for (const proxy of mergeBase.proxies as MergeablePropertyProxyOfArray[]) {
    let position: number;
    switch (proxy.mergeMethod) {
      case "append":
        position = baseValue.length;
        break;
      case "prepend":
        position = 0;
        break;
      case "insertAt":
        // Defaults to `-1`.
        position = (proxy.mergeArgs as [number])?.[0] ?? -1;
        if (position < 0) {
          // It's counted from the end if position is negative.
          position += quasis.length;
        }
        position = clamp(position, 0, baseValue.length);
        break;
      // istanbul ignore next: should never reach
      default:
        throw new TypeError(
          `unsupported mergeMethod: "${proxy.mergeMethod}" for mergeType "${proxy.mergeType}"`
        );
    }
    let patchValue = object[proxy.$$reversedRef] as unknown[];
    if (!Array.isArray(patchValue)) {
      patchValue = [];
    }
    quasis[position].push(...patchValue);
  }

  return quasis.flatMap((item, index) =>
    index < baseValue.length ? item.concat(baseValue[index]) : item
  );
}

function propertyMergeAllOfObject(
  mergeBase: MergeBase,
  object: Record<string, unknown>
): Record<string, unknown> {
  const baseValue = mergeBase.baseValue as Record<string, unknown>;
  return mergeBase.proxies.reduce((acc, proxy) => {
    switch (proxy.mergeMethod) {
      case "extend":
        return {
          ...acc,
          ...(object[proxy.$$reversedRef] as Record<string, unknown>),
        };
      // istanbul ignore next: should never reach
      default:
        throw new TypeError(
          `unsupported mergeMethod: "${proxy.mergeMethod}" for mergeType "${proxy.mergeType}"`
        );
    }
  }, baseValue);
}
