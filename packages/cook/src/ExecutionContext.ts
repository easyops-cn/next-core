import {
  ArrowFunctionExpression,
  Expression,
  FunctionDeclaration,
  FunctionExpression,
  Statement,
} from "@babel/types";

// https://tc39.es/ecma262/#sec-execution-contexts
export class ExecutionContext {
  VariableEnvironment: EnvironmentRecord;
  LexicalEnvironment: EnvironmentRecord;
  Function: FunctionObject;
}

export type EnvironmentRecordType = "function" | "declarative";

// https://tc39.es/ecma262/#sec-environment-records
export class EnvironmentRecord {
  readonly OuterEnv: EnvironmentRecord;
  private readonly bindingMap = new Map<string, BindingState>();

  constructor(outer: EnvironmentRecord) {
    this.OuterEnv = outer;
  }

  _debug_only_GetBindingMap(): Map<string, BindingState> {
    return this.bindingMap;
  }

  HasBinding(name: string): boolean {
    return this.bindingMap.has(name);
  }

  CreateMutableBinding(name: string, deletable: boolean): CompletionRecord {
    // Assert: binding does not exist.
    this.bindingMap.set(name, {
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
  CreateImmutableBinding(name: string, strict: boolean): CompletionRecord {
    // Assert: binding does not exist.
    this.bindingMap.set(name, {
      strict,
    });
    return NormalCompletion(undefined);
  }

  InitializeBinding(name: string, value: unknown): CompletionRecord {
    const binding = this.bindingMap.get(name);
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
  SetMutableBinding(
    name: string,
    value: unknown,
    strict: boolean
  ): CompletionRecord {
    const binding = this.bindingMap.get(name);
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

  GetBindingValue(name: string, strict: boolean): unknown {
    const binding = this.bindingMap.get(name);
    // Assert: binding exists.
    if (!binding.initialized) {
      throw new ReferenceError(`${name} is not initialized`);
    }
    return binding.value;
  }
}

export class DeclarativeEnvironment extends EnvironmentRecord {}

export class FunctionEnvironment extends EnvironmentRecord {}

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
}

// https://tc39.es/ecma262/#sec-reference-record-specification-type
export class ReferenceRecord {
  readonly Base?:
    | Record<PropertyKey, unknown>
    | EnvironmentRecord
    | "unresolvable";
  readonly ReferenceName?: PropertyKey;
  /** Whether the reference is in strict mode. */
  readonly Strict?: boolean;

  constructor(
    base: Record<PropertyKey, unknown> | EnvironmentRecord | "unresolvable",
    referenceName: PropertyKey,
    strict: boolean
  ) {
    this.Base = base;
    this.ReferenceName = referenceName;
    this.Strict = strict;
  }
}

// https://tc39.es/ecma262/#sec-completion-record-specification-type
export class CompletionRecord {
  readonly Type: CompletionRecordType;
  readonly Value: unknown;

  constructor(type: CompletionRecordType, value: unknown) {
    this.Type = type;
    this.Value = value;
  }
}

export type CompletionRecordType =
  | "normal"
  | "break"
  | "continue"
  | "return"
  | "throw";

// https://tc39.es/ecma262/#sec-normalcompletion
export function NormalCompletion(value: unknown): CompletionRecord {
  return new CompletionRecord("normal", value);
}

export const Empty = Symbol("empty completion");

export interface OptionalChainRef {
  skipped?: boolean;
}
