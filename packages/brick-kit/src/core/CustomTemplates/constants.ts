import {
  CustomTemplate,
  RefForProxy,
  RuntimeBrickConf,
  TemplateRegistry,
} from "@next-core/brick-types";

export const customTemplateRegistry: TemplateRegistry<CustomTemplate> =
  new Map();
export const appRegistered = new Set<string>();

export const symbolForComputedPropsFromProxy = Symbol.for(
  "tpl.computedPropsFromProxy"
);
export const symbolForRefForProxy = Symbol.for("tpl.refForProxy");
export const symbolForTplContextId = Symbol.for("tpl.contextId");

export type RuntimeBrickConfWithTplSymbols = RuntimeBrickConf &
  RuntimeBrickConfOfTplSymbols;

export interface RuntimeBrickConfOfTplSymbols {
  [symbolForComputedPropsFromProxy]?: Record<string, any>;
  [symbolForRefForProxy]?: RefForProxy;
  [symbolForTplContextId]?: string;
}
