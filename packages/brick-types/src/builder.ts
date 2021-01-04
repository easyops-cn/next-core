/** @internal */
export type BuilderRouteOrBrickNode = BuilderBrickNode | BuilderRouteNode;

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
}

/** @internal */
export interface BuilderBrickNode extends BuilderBaseNode {
  type: "brick" | "template";
  brick: string;
  properties?: string;
}
