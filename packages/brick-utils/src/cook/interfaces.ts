import {
  Expression,
  FunctionDeclaration,
  Node,
  UnaryExpression,
  VariableDeclaration,
} from "@babel/types";
import { CookScope, PrecookScope } from "./Scope";

export interface ChainExpression {
  type: "ChainExpression";
  expression: Expression;
}

export interface PrecookOptions {
  visitors?: Record<string, VisitorFn<PrecookVisitorState>>;
}

export interface PrecookFunctionOptions extends PrecookOptions {
  typescript?: boolean;
}

export interface PrecookVisitorState {
  scopeStack: PrecookScope[];
  attemptToVisitGlobals: Set<string>;
  scopeMapByNode: WeakMap<Node, PrecookScope>;
  isRoot?: boolean;
  identifierAsLiteralString?: boolean;
  collectVariableNamesAsKind?: ScopeVariableKind;
  isFunctionBody?: boolean;
  hoisting?: boolean;
}

export type ScopeVariableKind =
  | "param"
  | VariableDeclaration["kind"]
  | "functions";

export interface BasePreResult {
  source: string;
  attemptToVisitGlobals: Set<string>;
  scopeMapByNode: WeakMap<Node, PrecookScope>;
}

export interface PrecookResult extends BasePreResult {
  expression: Expression;
}

export interface CookVisitorState<T = unknown> {
  source: string;
  rules: CookRules;
  scopeMapByNode: WeakMap<Node, PrecookScope>;
  scopeStack: CookScope[];
  raiseError: FnRaiseError;
  cookingFunction?: boolean;
  isRoot?: boolean;
  identifierAsLiteralString?: boolean;
  spreadAsProperties?: boolean;
  isFunctionBody?: boolean;
  hoisting?: boolean;
  unaryOperator?: UnaryExpression["operator"];
  assignment?: CookAssignmentData;
  update?: CookUpdateData;
  chainRef?: {
    skipped?: boolean;
  };
  memberCooked?: {
    object: ObjectCooked;
    property: PropertyCooked;
  };
  returns?: {
    returned: boolean;
    cooked?: unknown;
  };
  controlFlow?: {
    switchDiscriminantCooked?: unknown;
    switchTested?: boolean;
    // Broken or returned.
    broken?: boolean;
    continued?: boolean;
  };
  caughtError?: unknown;
  cooked?: T;
}

export interface CookAssignmentData {
  operator?: string;
  initializing?: boolean;
  rightCooked?: unknown;
}

export interface CookUpdateData {
  operator: "++" | "--";
  prefix: boolean;
}

export type PropertyCooked = string | number;
export type PropertyEntryCooked = [PropertyCooked, unknown];
export type ObjectCooked = Record<PropertyCooked, unknown>;

export type VisitorCallback<T> = (node: any, state: T) => void;

export type VisitorFn<T> = (
  node: any,
  state: T,
  callback: VisitorCallback<T>
) => void;

export interface PrecookFunctionResult extends BasePreResult {
  function: FunctionDeclaration;
  rootBlockScope: PrecookScope;
}

export interface ICookVisitor {
  [key: string]: VisitorFn<CookVisitorState>;
}

export interface EstreeLiteral {
  value: unknown;
  raw: string;
  regex?: {
    flags: string;
  };
}

export interface CookFunctionOptions {
  rules?: CookRules;
  globalVariables?: Record<string, unknown>;
}

export interface CookRules {
  noVar?: boolean;
}

// export type FnRaiseError = (
//   error: ErrorConstructor,
//   message: string,
//   node?: Node
// ) => void;

export interface FnRaiseError {
  (error: ErrorConstructor, message: string, node?: Node): void;

  notFunction: (node: Node) => void;
}
