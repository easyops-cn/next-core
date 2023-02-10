import type { BrickConf } from "@next-core/brick-types";
import type { AsyncProperties, BrickHolder } from "../interfaces.js";

export const symbolForComputedProps = Symbol.for("tpl.computedProps");
export const symbolForAsyncComputedProps = Symbol.for("tpl.asyncComputedProps");
export const symbolForBrickHolder = Symbol.for("tpl.brickHolder");
export const symbolForTplStateStoreId = Symbol.for("tpl.stateStoreId");

export type RuntimeBrickConfWithTplSymbols = BrickConf &
  RuntimeBrickConfOfTplSymbols;

export interface RuntimeBrickConfOfTplSymbols {
  [symbolForAsyncComputedProps]?: AsyncProperties;
  [symbolForComputedProps]?: Record<string, unknown>;
  [symbolForBrickHolder]?: BrickHolder;
  [symbolForTplStateStoreId]?: string;
}
