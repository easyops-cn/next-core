import type {
  RefForProxy,
  BrickConf,
  AsyncProperties,
} from "@next-core/brick-types";

export const symbolForComputedPropsFromProxy = Symbol.for(
  "tpl.computedPropsFromProxy"
);
export const symbolForRefForProxy = Symbol.for("tpl.refForProxy");
export const symbolForTplContextId = Symbol.for("tpl.contextId");

export type RuntimeBrickConfWithTplSymbols = BrickConf &
  RuntimeBrickConfOfTplSymbols;

export interface RuntimeBrickConfOfTplSymbols {
  [symbolForComputedPropsFromProxy]?: AsyncProperties;
  [symbolForRefForProxy]?: RefForProxy;
  [symbolForTplContextId]?: string;
}
