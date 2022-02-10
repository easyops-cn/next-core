import {
  CustomTemplate,
  RefForProxy,
  RuntimeBrickConf,
  RuntimeBrickElement,
  TemplateRegistry,
} from "@next-core/brick-types";
import { RefObject } from "react";

export const customTemplateRegistry: TemplateRegistry<CustomTemplate> =
  new Map();
export const appRegistered = new Set<string>();

export const symbolForComputedPropsFromProxy = Symbol.for(
  "tpl.computedPropsFromProxy"
);
export const symbolForRefForProxy = Symbol.for("tpl.refForProxy");
export const symbolForTplContextId = Symbol.for("tpl.contextId");
export const symbolForIsExternal = Symbol.for("tpl.isExternal");
export const symbolForParentRefForUseBrickInPortal = Symbol.for(
  "parentRefForUseBrickInPortal"
);

export interface RuntimeBrickConfWithTplSymbols extends RuntimeBrickConf {
  [symbolForComputedPropsFromProxy]?: Record<string, any>;
  [symbolForRefForProxy]?: RefForProxy;
  [symbolForIsExternal]?: boolean;
  [symbolForTplContextId]?: string;
}

export interface RuntimeBrickElementWithTplSymbols extends RuntimeBrickElement {
  [symbolForTplContextId]?: string;
  [symbolForIsExternal]?: boolean;
  [symbolForParentRefForUseBrickInPortal]?: RefObject<HTMLElement>;
}
