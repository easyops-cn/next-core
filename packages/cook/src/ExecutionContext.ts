import {
  ArrowFunctionExpression,
  Expression,
  FunctionDeclaration,
  FunctionExpression,
  Statement,
} from "@babel/types";

// https://tc39.es/ecma262/#sec-execution-contexts
export interface ExecutionContext {
  VariableEnvironment: EnvironmentRecord;
  LexicalEnvironment: EnvironmentRecord;
  Function: FunctionObject;
}

export const symbolOfEnvironmentRecord = Symbol("EnvironmentRecord");

// https://tc39.es/ecma262/#sec-environment-records
export interface EnvironmentRecord {
  [symbolOfEnvironmentRecord]: true;
  readonly OuterEnv: EnvironmentRecord | null;
  bindingMap: Map<string, BindingState>;
}

export function CreateEnvironmentRecord(
  OuterEnv: EnvironmentRecord
): EnvironmentRecord {
  return {
    [symbolOfEnvironmentRecord]: true,
    OuterEnv,
    bindingMap: new Map(),
  };
}

export function IsEnvironmentRecord(V: unknown): V is EnvironmentRecord {
  // try {
  return V && (V as EnvironmentRecord)[symbolOfEnvironmentRecord];
  // } catch (error) {
  //   console.error("IsEnvironmentRecord failed for:", typeof V, V);
  //   return false;
  // }
}

export function HasBinding(This: EnvironmentRecord, name: string): boolean {
  return This.bindingMap.has(name);
}

export function CreateMutableBinding(
  This: EnvironmentRecord,
  name: string,
  deletable: boolean
): CompletionRecord {
  // Assert: binding does not exist.
  This.bindingMap.set(name, {
    mutable: true,
    deletable,
  });
  return NormalCompletion(undefined);
}

/**
 * Create an immutable binding.
 *
 * @param name - The binding name.
 * @param strict - For named function expressions, strict is false, otherwise it's true.
 * @returns CompletionRecord.
 */
export function CreateImmutableBinding(
  This: EnvironmentRecord,
  name: string,
  strict: boolean
): CompletionRecord {
  // Assert: binding does not exist.
  This.bindingMap.set(name, {
    strict,
  });
  return NormalCompletion(undefined);
}

export function InitializeBinding(
  This: EnvironmentRecord,
  name: string,
  value: unknown
): CompletionRecord {
  const binding = This.bindingMap.get(name);
  // Assert: binding exists and uninitialized.
  Object.assign<BindingState, Partial<BindingState>>(binding, {
    initialized: true,
    value,
  });
  return NormalCompletion(undefined);
}

/**
 * Update a mutable binding value, including function declarations.
 *
 * @param name - The binding name.
 * @param value - The binding value.
 * @param strict - For functions, strict is always false, otherwise it depends on strict-mode.
 * @returns
 */
export function SetMutableBinding(
  This: EnvironmentRecord,
  name: string,
  value: unknown,
  strict: boolean
): CompletionRecord {
  const binding = This.bindingMap.get(name);
  // Assert: binding exists.
  if (!binding.initialized) {
    throw new ReferenceError(`${name} is not initialized`);
  } else if (binding.mutable) {
    binding.value = value;
  } else {
    throw new TypeError(`Assignment to constant variable`);
  }
  return NormalCompletion(undefined);
}

export function GetBindingValue(
  This: EnvironmentRecord,
  name: string,
  strict: boolean
): unknown {
  const binding = This.bindingMap.get(name);
  // Assert: binding exists.
  if (!binding.initialized) {
    throw new ReferenceError(`${name} is not initialized`);
  }
  return binding.value;
}

export const CreateDeclarativeEnvironment = CreateEnvironmentRecord;
export const CreateFunctionEnvironment = CreateEnvironmentRecord;
export type DeclarativeEnvironment = EnvironmentRecord;
export type FunctionEnvironment = EnvironmentRecord;

export interface BindingState {
  initialized?: boolean;
  value?: unknown;
  mutable?: boolean;

  /** This is used for mutable bindings only. */
  deletable?: boolean;

  /**
   * This is used for immutable bindings only.
   * For named function expressions, `strict` is false,
   * otherwise it's true.
   */
  strict?: boolean;
}

export const SourceNode = Symbol.for("SourceNode");
export const FormalParameters = Symbol.for("FormalParameters");
export const ECMAScriptCode = Symbol.for("ECMAScriptCode");
export const Environment = Symbol.for("Environment");
export const IsConstructor = Symbol.for("IsConstructor");
export const Memoized = Symbol.for("Memoized");

export interface FunctionObject {
  (...args: unknown[]): unknown;
  [SourceNode]:
    | FunctionDeclaration
    | FunctionExpression
    | ArrowFunctionExpression;
  [FormalParameters]: FunctionDeclaration["params"];
  [ECMAScriptCode]: Statement[] | Expression;
  [Environment]: EnvironmentRecord;
  [IsConstructor]: boolean;
  [Memoized]?: {
    parameterNames: string[];
    hasParameterExpressions: boolean;
    varNames: string[];
    functionNames: string[];
    functionsToInitialize: FunctionDeclaration[];
  };
}

// https://tc39.es/ecma262/#sec-reference-record-specification-type
// export class ReferenceRecord {
//   readonly Base?:
//     | Record<PropertyKey, unknown>
//     | EnvironmentRecord
//     | "unresolvable";
//   readonly ReferenceName?: PropertyKey;
//   /** Whether the reference is in strict mode. */
//   readonly Strict?: boolean;

//   constructor(
//     base: Record<PropertyKey, unknown> | EnvironmentRecord | "unresolvable",
//     referenceName: PropertyKey,
//     strict: boolean
//   ) {
//     this.Base = base;
//     this.ReferenceName = referenceName;
//     this.Strict = strict;
//   }
// }

export const SymbolOfReferenceRecord = Symbol("ReferenceRecord");

export interface ReferenceRecord {
  readonly [SymbolOfReferenceRecord]: true;
  readonly Base?:
    | Record<PropertyKey, unknown>
    | EnvironmentRecord
    | "unresolvable";
  readonly ReferenceName?: PropertyKey;
  /** Whether the reference is in strict mode. */
  readonly Strict?: boolean;
}

export function CreateReferenceRecord(
  base: Record<PropertyKey, unknown> | EnvironmentRecord | "unresolvable",
  referenceName: PropertyKey,
  strict: boolean
): ReferenceRecord {
  return {
    [SymbolOfReferenceRecord]: true,
    Base: base,
    ReferenceName: referenceName,
    Strict: strict,
  };
}

export function IsReferenceRecord(V: unknown): V is ReferenceRecord {
  return V && (V as ReferenceRecord)[SymbolOfReferenceRecord];
}

// https://tc39.es/ecma262/#sec-completion-record-specification-type
// export class CompletionRecord {
//   readonly Type: CompletionRecordType;
//   readonly Value: unknown;

//   constructor(type: CompletionRecordType, value: unknown) {
//     this.Type = type;
//     this.Value = value;
//   }
// }

export const SymbolOfCompletionRecord = Symbol("CompletionRecord");

export interface CompletionRecord {
  readonly [SymbolOfCompletionRecord]: true;
  readonly Type: CompletionRecordType;
  readonly Value: unknown;
}

export type CompletionRecordType =
  | "normal"
  | "break"
  | "continue"
  | "return"
  | "throw";

// https://tc39.es/ecma262/#sec-normalcompletion
export function NormalCompletion(value: unknown): CompletionRecord {
  // return new CompletionRecord("normal", value);
  return {
    [SymbolOfCompletionRecord]: true,
    Type: "normal",
    Value: value,
  };
}

// https://tc39.es/ecma262/#sec-normalcompletion
export function OtherCompletion(
  type: CompletionRecordType,
  value: unknown
): CompletionRecord {
  return {
    [SymbolOfCompletionRecord]: true,
    Type: type,
    Value: value,
  };
}

export const Empty = Symbol("empty completion");

export interface OptionalChainRef {
  skipped?: boolean;
}
