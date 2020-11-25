import {
  BrickConfInTemplate,
  PluginRuntimeContext,
} from "@easyops/brick-types";
import { MergeablePropertyProxy, MergeBase } from "./internalInterfaces";

export function collectMergeBases(
  conf: MergeablePropertyProxy,
  mergeBases: Map<string, Map<string, MergeBase>>,
  contextInTemplate: PluginRuntimeContext,
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
    conf.$$mergeBase = {
      proxies: [conf],
      mergeType: conf.mergeType,
      baseValue,
      context: contextInTemplate,
    };
    mergeBaseMap.set(conf.mergeProperty, conf.$$mergeBase);
  }
}
