import type { BrickConf } from "@next-core/types";
import type { AsyncPropertyEntry } from "../interfaces.js";

export const symbolForAsyncComputedPropsFromHost = Symbol.for(
  "tpl.asyncComputedPropsFromHost"
);
export const symbolForTplStateStoreId = Symbol.for("tpl.stateStoreId");
export const symbolForTPlExternalForEachItem = Symbol.for(
  "tpl.externalForEachItem"
);

export type RuntimeBrickConfWithTplSymbols = BrickConf &
  RuntimeBrickConfOfTplSymbols;

export interface RuntimeBrickConfOfTplSymbols {
  [symbolForAsyncComputedPropsFromHost]?: AsyncPropertyEntry[];
  [symbolForTplStateStoreId]?: string;
  [symbolForTPlExternalForEachItem]?: unknown;
}
