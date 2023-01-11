import { RuntimeBrickConf } from "@next-core/brick-types";

export const formRenderer = "form-renderer.form-renderer";
export const filterProperties: string[] = [
  "instanceId",
  "brick",
  "slots",
  "properties",
  "events",
  "if",
  "context",
  "bricks",
  "mountPoint",
];
export const symbolForFormContextId = Symbol.for("form.contextId");
export interface RuntimeBrickConfOfFormSymbols {
  [symbolForFormContextId]?: string;
}
export type RuntimeBrickConfWithFormSymbols = RuntimeBrickConf &
  RuntimeBrickConfOfFormSymbols;
