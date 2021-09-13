import {
  Expression,
  FunctionDeclaration,
  LVal,
  Node,
  ObjectExpression,
  ObjectPattern,
  ObjectProperty,
  RestElement,
  SpreadElement,
  VariableDeclaration,
} from "@babel/types";

export type EstreeNode =
  | Node
  | EstreeObjectExpression
  | EstreeObjectPattern
  | EstreeProperty
  | EstreeChainExpression
  | EstreeLiteral;

export type EstreeLVal = LVal | EstreeObjectPattern;

export type EstreeObjectExpression = Omit<ObjectExpression, "properties"> & {
  properties: (EstreeProperty | SpreadElement)[];
};

export type EstreeObjectPattern = Omit<ObjectPattern, "properties"> & {
  properties: (EstreeProperty | RestElement)[];
};

export type EstreeProperty = Omit<ObjectProperty, "type"> & {
  type: "Property";
  kind: "init" | "get" | "set";
};

export interface EstreeChainExpression {
  type: "ChainExpression";
  expression: Expression;
}

export interface EstreeLiteral {
  type: "Literal";
  value: unknown;
  raw: string;
  regex?: {
    flags: string;
  };
}

export type NodeWithBoundNames =
  | LVal
  | VariableDeclaration
  | FunctionDeclaration;

export type EstreeVisitors = Record<string, EstreeVisitorFn>;

export type EstreeVisitorFn = (node: any) => void;
