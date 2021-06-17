import { BrickConf, ContextConf, I18nData } from "./manifest";

/** @internal */
export type BuilderRouteOrBrickNode =
  | BuilderBrickNode
  | BuilderRouteNode
  | BuilderCustomTemplateNode
  | BuilderSnippetNode;

/** @internal */
export interface BuilderBaseNode {
  parent?: BuilderBaseNode[];
  children?: BuilderRouteOrBrickNode[];
  id: string;
  instanceId?: string;
  mountPoint?: string;
  alias?: string;
  [key: string]: unknown;
}

/** @internal */
export interface BuilderRouteNode extends BuilderBaseNode {
  type: "bricks" | "routes" | "redirect";
  path: string;
  menu?: string;
  providers?: string;
  segues?: string;
  defineResolves?: string;
  redirect?: string;
  context?: ContextConf[];
}

/** @internal */
export interface BuilderBrickNode extends BuilderBaseNode {
  type: "brick" | "provider" | "template";
  brick: string;
  properties?: string;
  events?: string;
  bg?: boolean;
  portal?: boolean;
  context?: ContextConf[];
}

/** @internal */
export interface BuilderCustomTemplateNode extends BuilderBaseNode {
  type: "custom-template";
  templateId: string;
  proxy?: string;
}

/** @internal */
export interface BuilderSnippetNode extends BuilderBaseNode {
  type: "snippet";
  snippetId: string;
  category?: string;
  subCategory?: string;
  text?: I18nData;
  description?: I18nData;
  thumbnail?: string;
}

/**
 * For snippets defined in brick packages.
 * @internal
 */
export interface SnippetDefinition {
  id: string;
  bricks: BrickConf[];
  category: string;
  subCategory?: string;
  text?: I18nData;
  description?: I18nData;
  thumbnail?: string;
}
