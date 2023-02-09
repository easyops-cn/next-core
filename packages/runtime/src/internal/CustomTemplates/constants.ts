import type { BrickConf } from "@next-core/brick-types";
import type { AsyncProperties, BrickHolder } from "../interfaces.js";

export const symbolForComputedPropsFromProxy = Symbol.for(
  "tpl.computedPropsFromProxy"
);
export const symbolForBrickHolder = Symbol.for("tpl.brickHolder");
export const symbolForTplStateStoreId = Symbol.for("tpl.stateStoreId");

export type RuntimeBrickConfWithTplSymbols = BrickConf &
  RuntimeBrickConfOfTplSymbols;

export interface RuntimeBrickConfOfTplSymbols {
  [symbolForComputedPropsFromProxy]?: AsyncProperties;
  [symbolForBrickHolder]?: BrickHolder;
  [symbolForTplStateStoreId]?: string;
}
