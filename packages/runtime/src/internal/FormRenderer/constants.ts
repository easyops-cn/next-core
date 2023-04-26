import type { BrickConf } from "@next-core/types";

export const FORM_RENDERER = "form-renderer.form-renderer";
export const symbolForFormStateStoreId = Symbol.for("form.stateStoreId");

export type RuntimeBrickConfWithFormSymbols = BrickConf &
  RuntimeBrickConfOfFormSymbols;

export interface RuntimeBrickConfOfFormSymbols {
  [symbolForFormStateStoreId]?: string;
}
