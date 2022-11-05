import { parse } from "@babel/parser";
import {
  Expression,
  FunctionDeclaration,
  LVal,
  Node,
  ObjectExpression,
  ObjectPattern,
  ObjectProperty,
  RestElement,
  SourceLocation,
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
  loc: SourceLocation;
}

export interface EstreeLiteral {
  type: "Literal";
  value: unknown;
  raw: string;
  regex?: {
    flags: string;
  };
  loc: SourceLocation;
}

export type NodeWithBoundNames =
  | LVal
  | VariableDeclaration
  | FunctionDeclaration;

export type EstreeVisitors = Record<string, EstreeVisitorFn>;

export type EstreeVisitorFn = (node: any) => void;

export interface CookRules {
  noVar?: boolean;
}

export type ParseResultOfFile = ReturnType<typeof parse>;
