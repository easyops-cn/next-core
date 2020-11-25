import { isObject } from "@easyops/brick-utils";
import { clamp } from "lodash";
import { computeRealValue } from "../../setProperties";
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

function propertyMergeAllOfArray(
  { baseValue, context, proxies }: MergeBase,
  object: Record<string, unknown>
): unknown[] {
  // Use an approach like template-literal's quasis:
  // `quasi0${0}quais1${1}quasi2...`
  // Every quasi can be merged with multiple items.
  const computedBaseValue = Array.isArray(baseValue)
    ? (computeRealValue(baseValue, context, true) as unknown[])
    : [];
  const quasis: unknown[][] = [];
  const size = computedBaseValue.length + 1;
  for (let i = 0; i < size; i += 1) {
    quasis.push([]);
  }

  for (const proxy of proxies as MergeablePropertyProxyOfArray[]) {
    let position: number;
    switch (proxy.mergeMethod) {
      case "append":
        position = computedBaseValue.length;
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
        position = clamp(position, 0, computedBaseValue.length);
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
    index < computedBaseValue.length
      ? item.concat(computedBaseValue[index])
      : item
  );
}

function propertyMergeAllOfObject(
  { baseValue, proxies, context }: MergeBase,
  object: Record<string, unknown>
): Record<string, unknown> {
  const computedBaseValue = isObject(baseValue)
    ? (computeRealValue(baseValue, context, true) as Record<string, unknown>)
    : {};
  return proxies.reduce((acc, proxy) => {
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
  }, computedBaseValue);
}
