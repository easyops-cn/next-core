import {
  CustomTemplate,
  ProbablyRuntimeBrick,
  RefForProxy,
  RuntimeBrickConf,
  RuntimeBrickElement,
  TemplateRegistry,
} from "@next-core/brick-types";
import { RefObject } from "react";

export const customTemplateRegistry: TemplateRegistry<CustomTemplate> = new Map();
export const appRegistered = new Set<string>();

export const symbolForComputedPropsFromProxy = Symbol.for(
  "tpl.computedPropsFromProxy"
);
export const symbolForRefForProxy = Symbol.for("tpl.refForProxy");
export const symbolForParentTemplate = Symbol.for("tpl.parentTemplate");
export const symbolForTplContextId = Symbol.for("tpl.contextId");
export const symbolForParentRefForUseBrickInPortal = Symbol.for(
  "parentRefForUseBrickInPortal"
);

export interface RuntimeBrickConfWithTplSymbols extends RuntimeBrickConf {
  [symbolForComputedPropsFromProxy]?: Record<string, any>;
  [symbolForRefForProxy]?: RefForProxy;
  [symbolForParentTemplate]?: ProbablyRuntimeBrick;
  [symbolForTplContextId]?: string;
}

export interface RuntimeBrickElementWithTplSymbols extends RuntimeBrickElement {
  [symbolForParentTemplate]?: RuntimeBrickElementWithTplSymbols;
  [symbolForParentRefForUseBrickInPortal]?: RefObject<HTMLElement>;
}
