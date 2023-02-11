import type { BrickConf } from "@next-core/brick-types";
import type { AsyncProperties, BrickHolder } from "../interfaces.js";

export const symbolForComputedPropsFromHost = Symbol.for(
  "tpl.computedPropsFromHost"
);
export const symbolForAsyncComputedPropsFromHost = Symbol.for(
  "tpl.asyncComputedPropsFromHost"
);
export const symbolForBrickHolder = Symbol.for("tpl.brickHolder");
export const symbolForTplStateStoreId = Symbol.for("tpl.stateStoreId");

export type RuntimeBrickConfWithTplSymbols = BrickConf &
  RuntimeBrickConfOfTplSymbols;

export interface RuntimeBrickConfOfTplSymbols {
  [symbolForAsyncComputedPropsFromHost]?: AsyncProperties;
  [symbolForComputedPropsFromHost]?: Record<string, unknown>;
  [symbolForBrickHolder]?: BrickHolder;
  [symbolForTplStateStoreId]?: string;
}
