import {
  BrickConfInTemplate,
  PluginRuntimeContext,
} from "@easyops/brick-types";
import { isObject } from "@easyops/brick-utils";
import { computeRealValue } from "../../setProperties";
import { MergeablePropertyProxy, MergeBase } from "../internalInterfaces";

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
