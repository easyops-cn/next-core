import { Expression } from "@babel/types";

export type PrecookScope = Set<string>;

export interface PrecookVisitorState {
  currentScope: PrecookScope;
  closures: PrecookScope[];
  attemptToVisitGlobals: Set<string>;
  identifierAsLiteralString?: boolean;
  collectParamNamesOnly?: string[];
}

export interface PrecookResult {
  source: string;
  expression: Expression;
  attemptToVisitGlobals: Set<string>;
}

export type CookScope = Map<string, CookScopeRef>;

export type CookScopeRef = {
  initialized: boolean;
  cooked?: any;
};

export interface CookVisitorState<T = any> {
  source: string;
  currentScope: CookScope;
  closures: CookScope[];
  identifierAsLiteralString?: boolean;
  spreadAsProperties?: boolean;
  collectParamNamesOnly?: string[];
  cookParamOnly?: boolean;
  argReceived?: any;
  optionalRef?: {
    ignored?: boolean;
  };
  memberCooked?: {
    object: ObjectCooked;
    property: PropertyCooked;
  };
  cooked?: T;
}

export type PropertyCooked = string | number;
export type PropertyEntryCooked = [PropertyCooked, any];
export type ObjectCooked = Record<PropertyCooked, any>;

export type VisitorCallback<T> = (node: any, state: T) => void;

export type VisitorFn<T> = (
  node: any,
  state: T,
  callback: VisitorCallback<T>
) => void;
