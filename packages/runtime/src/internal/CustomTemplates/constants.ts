import type { BrickConf } from "@next-core/brick-types";
import type { AsyncProperties, BrickHolder } from "../interfaces.js";

export const symbolForAsyncComputedPropsFromHost = Symbol.for(
  "tpl.asyncComputedPropsFromHost"
);
export const symbolForBrickHolder = Symbol.for("tpl.brickHolder");
export const symbolForTplStateStoreId = Symbol.for("tpl.stateStoreId");
export const symbolForTPlExternalForEachItem = Symbol.for(
  "tpl.externalForEachItem"
);

export type RuntimeBrickConfWithTplSymbols = BrickConf &
  RuntimeBrickConfOfTplSymbols;

export interface RuntimeBrickConfOfTplSymbols {
  [symbolForAsyncComputedPropsFromHost]?: AsyncProperties;
  [symbolForBrickHolder]?: BrickHolder;
  [symbolForTplStateStoreId]?: string;
  [symbolForTPlExternalForEachItem]?: unknown;
}
