import {
  CustomTemplate,
  ProbablyRuntimeBrick,
  RefForProxy,
  RuntimeBrickConf,
  RuntimeBrickElement,
  TemplateRegistry,
} from "@easyops/brick-types";

export const customTemplateRegistry: TemplateRegistry<CustomTemplate> = new Map();
export const appRegistered = new Set<string>();

export const symbolForComputedPropsFromProxy = Symbol.for(
  "tpl.computedPropsFromProxy"
);
export const symbolForRefForProxy = Symbol.for("tpl.refForProxy");
export const symbolForParentTemplate = Symbol.for("tpl.parentTemplate");

export interface RuntimeBrickConfWithTplSymbols extends RuntimeBrickConf {
  [symbolForComputedPropsFromProxy]?: Record<string, any>;
  [symbolForRefForProxy]?: RefForProxy;
  [symbolForParentTemplate]?: ProbablyRuntimeBrick;
}

export interface RuntimeBrickElementWithTplSymbols extends RuntimeBrickElement {
  [symbolForParentTemplate]?: RuntimeBrickElementWithTplSymbols;
}
