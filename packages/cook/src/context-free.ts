import {
  BinaryExpression,
  UnaryExpression,
  VariableDeclaration,
} from "@babel/types";
import {
  CompletionRecord,
  CreateImmutableBinding,
  CreateMutableBinding,
  CreateReferenceRecord,
  Empty,
  EnvironmentRecord,
  GetBindingValue,
  HasBinding,
  InitializeBinding,
  IsEnvironmentRecord,
  IsReferenceRecord,
  NormalCompletion,
  OtherCompletion,
  ReferenceRecord,
  SetMutableBinding,
  SymbolOfCompletionRecord,
} from "./ExecutionContext";
import { collectBoundNames } from "./traverse";

// https://tc39.es/ecma262/#sec-ispropertyreference
export function IsPropertyReference(V: ReferenceRecord): boolean {
  return V.Base !== "unresolvable" && !IsEnvironmentRecord(V.Base);
}

// https://tc39.es/ecma262/#sec-initializereferencedbinding
export function InitializeReferencedBinding(
  V: ReferenceRecord,
  W: unknown
): CompletionRecord {
  const base = V.Base as EnvironmentRecord;
  return InitializeBinding(base, V.ReferenceName as string, W);
}

// https://tc39.es/ecma262/#sec-copydataproperties
export function CopyDataProperties(
  target: Record<PropertyKey, unknown>,
  source: unknown,
  excludedItems: Set<PropertyKey>
): Record<PropertyKey, unknown> {
  if (source === undefined || source === null) {
    return target;
  }
  const keys = (Object.getOwnPropertyNames(source) as PropertyKey[]).concat(
    Object.getOwnPropertySymbols(source)
  );
  for (const nextKey of keys) {
    if (!excludedItems.has(nextKey)) {
      const desc = Object.getOwnPropertyDescriptor(source, nextKey);
      if (desc?.enumerable) {
        target[nextKey] = (source as Record<PropertyKey, unknown>)[nextKey];
      }
    }
  }
  return target;
}

// https://tc39.es/ecma262/#sec-runtime-semantics-fordeclarationbindinginstantiation
export function ForDeclarationBindingInstantiation(
  forDeclaration: VariableDeclaration,
  env: EnvironmentRecord
): void {
  const isConst = forDeclaration.kind === "const";
  for (const name of collectBoundNames(forDeclaration)) {
    if (isConst) {
      CreateImmutableBinding(env, name, true);
    } else {
      CreateMutableBinding(env, name, false);
    }
  }
}

// https://tc39.es/ecma262/#sec-loopcontinues
export function LoopContinues(completion: CompletionRecord): boolean {
  return completion.Type === "normal" || completion.Type == "continue";
}

// https://tc39.es/ecma262/#sec-updateempty
export function UpdateEmpty(
  completion: CompletionRecord,
  value: unknown
): CompletionRecord {
  if (completion.Value !== Empty) {
    return completion;
  }
  return OtherCompletion(completion.Type, value);
}

// https://tc39.es/ecma262/#sec-getvalue
export function GetValue(V: unknown): unknown {
  if (V && (V as CompletionRecord)[SymbolOfCompletionRecord]) {
    // Assert: V.Type is normal.
    V = (V as CompletionRecord).Value;
  }
  if (!IsReferenceRecord(V)) {
    return V;
  }
  if (V.Base === "unresolvable") {
    throw new ReferenceError(`${V.ReferenceName as string} is not defined`);
  }
  if (IsEnvironmentRecord(V.Base)) {
    const base = V.Base as EnvironmentRecord;
    return GetBindingValue(base, V.ReferenceName as string, V.Strict);
  }
  return V.Base[V.ReferenceName];
}

// https://tc39.es/ecma262/#sec-topropertykey
export function ToPropertyKey(arg: unknown): string | symbol {
  if (typeof arg === "symbol") {
    return arg;
  }
  return String(arg);
}

// https://tc39.es/ecma262/#sec-getv
export function GetV(V: unknown, P: PropertyKey): unknown {
  return (V as Record<PropertyKey, unknown>)[P];
}

// https://tc39.es/ecma262/#sec-putvalue
export function PutValue(V: ReferenceRecord, W: unknown): CompletionRecord {
  // Assert: V is a ReferenceRecord.
  if (V.Base === "unresolvable") {
    throw new ReferenceError(`${V.ReferenceName as string} is not defined`);
  }
  if (IsEnvironmentRecord(V.Base)) {
    return SetMutableBinding(V.Base, V.ReferenceName as string, W, V.Strict);
  }
  V.Base[V.ReferenceName] = W;
  return NormalCompletion(undefined);
}

// https://tc39.es/ecma262/#sec-createlistiteratorRecord
export function CreateListIteratorRecord(
  args: Iterable<unknown>
): Iterator<unknown> {
  if (!isIterable(args)) {
    throw new TypeError(`${typeof args} is not iterable`);
  }
  return args[Symbol.iterator]();
}

// https://tc39.es/ecma262/#sec-requireobjectcoercible
export function RequireObjectCoercible(arg: unknown): void {
  if (arg === null || arg === undefined) {
    throw new TypeError("Cannot destructure properties of undefined or null");
  }
}

// https://tc39.es/ecma262/#sec-getidentifierreference
export function GetIdentifierReference(
  env: EnvironmentRecord,
  name: string,
  strict: boolean
): ReferenceRecord {
  if (!env) {
    return CreateReferenceRecord("unresolvable", name, strict);
  }
  if (HasBinding(env, name)) {
    return CreateReferenceRecord(env, name, strict);
  }
  return GetIdentifierReference(env.OuterEnv, name, strict);
}

// https://tc39.es/ecma262/#sec-applystringornumericbinaryoperator
export function ApplyStringOrNumericBinaryOperator(
  leftValue: number,
  operator: BinaryExpression["operator"] | "|>",
  rightValue: number
): unknown {
  switch (operator) {
    case "+":
      return leftValue + rightValue;
    case "-":
      return leftValue - rightValue;
    case "/":
      return leftValue / rightValue;
    case "%":
      return leftValue % rightValue;
    case "*":
      return leftValue * rightValue;
    case "**":
      return leftValue ** rightValue;
    case "==":
      return leftValue == rightValue;
    case "===":
      return leftValue === rightValue;
    case "!=":
      return leftValue != rightValue;
    case "!==":
      return leftValue !== rightValue;
    case ">":
      return leftValue > rightValue;
    case "<":
      return leftValue < rightValue;
    case ">=":
      return leftValue >= rightValue;
    case "<=":
      return leftValue <= rightValue;
  }
  throw new SyntaxError(`Unsupported binary operator \`${operator}\``);
}

// https://tc39.es/ecma262/#sec-assignment-operators
export function ApplyStringOrNumericAssignment(
  leftValue: string | number,
  operator: string,
  rightValue: string | number
): unknown {
  switch (operator) {
    case "+=":
    case "-=":
    case "*=":
    case "/=":
    case "%=":
    case "**=":
      return ApplyStringOrNumericBinaryOperator(
        leftValue as number,
        operator.substr(0, operator.length - 1) as BinaryExpression["operator"],
        rightValue as number
      );
  }

  throw new SyntaxError(`Unsupported assignment operator \`${operator}\``);
}

// https://tc39.es/ecma262/#sec-unary-operators
export function ApplyUnaryOperator(
  target: unknown,
  operator: UnaryExpression["operator"]
): unknown {
  switch (operator) {
    case "!":
      return !target;
    case "+":
      return +target;
    case "-":
      return -target;
    case "void":
      return undefined;
  }
  throw new SyntaxError(`Unsupported unary operator \`${operator}\``);
}

export function isIterable(cooked: unknown): boolean {
  if (Array.isArray(cooked)) {
    return true;
  }
  if (cooked === null || cooked === undefined) {
    return false;
  }
  return typeof (cooked as Iterable<unknown>)[Symbol.iterator] === "function";
}
