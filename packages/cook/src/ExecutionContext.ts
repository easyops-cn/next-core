import type {
  ArrowFunctionExpression,
  Expression,
  FunctionDeclaration,
  FunctionExpression,
  Statement,
} from "@babel/types";
import type { EstreeNode } from "./interfaces.js";

export enum Mode {
  LEXICAL,
  STRICT,
}

export const SourceNode = Symbol.for("SourceNode");
export const FormalParameters = Symbol.for("FormalParameters");
export const ECMAScriptCode = Symbol.for("ECMAScriptCode");
export const Environment = Symbol.for("Environment");
export const IsConstructor = Symbol.for("IsConstructor");
export const ThisMode = Symbol.for("ThisMode");
export const DebuggerCall = Symbol.for("$DebuggerCall$");
export const DebuggerScope = Symbol.for("$DebuggerScope$");
export const DebuggerNode = Symbol.for("$DebuggerNode$");
export const DebuggerReturn = Symbol.for("$DebuggerReturn$");

// https://tc39.es/ecma262/#sec-execution-contexts
export class ExecutionContext {
  VariableEnvironment?: EnvironmentRecord;
  LexicalEnvironment?: EnvironmentRecord;
  Function?: FunctionObject;
}

export type EnvironmentRecordType = "function" | "declarative";

export enum BindingStatus {
  UNINITIALIZED,
  LEXICAL,
  INITIALIZED,
}

// https://tc39.es/ecma262/#sec-environment-records
export class EnvironmentRecord {
  readonly OuterEnv: EnvironmentRecord | null | undefined;
  private readonly bindingMap = new Map<string, BindingState>();
  protected ThisValue: unknown = undefined;
  protected ThisBindingStatus: BindingStatus | undefined;

  constructor(outer: EnvironmentRecord | null | undefined) {
    this.OuterEnv = outer;
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
    const binding = this.bindingMap.get(name) as BindingState;
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
    _strict?: boolean
  ): CompletionRecord {
    const binding = this.bindingMap.get(name) as BindingState;
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

  GetBindingValue(name: string, _strict?: boolean): unknown {
    const binding = this.bindingMap.get(name) as BindingState;
    // Assert: binding exists.
    if (!binding.initialized) {
      throw new ReferenceError(`${name} is not initialized`);
    }
    return binding.value;
  }

  BindThisValue(value: unknown) {
    // Assert: envRec.[[ThisBindingStatus]] is not LEXICAL.
    if (this.ThisBindingStatus === BindingStatus.INITIALIZED) {
      throw new Error("This binding has been initialized");
    }
    this.ThisValue = value;
    this.ThisBindingStatus = BindingStatus.INITIALIZED;
  }

  HasThisBinding() {
    return this.ThisBindingStatus !== BindingStatus.LEXICAL;
  }

  GetThisBinding() {
    // Assert: envRec.[[ThisBindingStatus]] is not LEXICAL.
    if (this.ThisBindingStatus === BindingStatus.UNINITIALIZED) {
      throw new Error("This binding is not initialized");
    }
    return this.ThisValue;
  }
}

export class DeclarativeEnvironment extends EnvironmentRecord {}

export class FunctionEnvironment extends EnvironmentRecord {
  constructor(F: FunctionObject) {
    super(F[Environment]);
    if (F[ThisMode] === Mode.LEXICAL) {
      this.ThisBindingStatus = BindingStatus.LEXICAL;
    } else {
      this.ThisBindingStatus = BindingStatus.UNINITIALIZED;
    }
  }
}

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
  [ThisMode]?: Mode;
  [DebuggerCall]?: (...args: unknown[]) => IterableIterator<unknown>;
  [DebuggerScope]?: () => EnvironmentRecord | null | undefined;
  [DebuggerNode]?: () => EstreeNode | undefined;
}

// https://tc39.es/ecma262/#sec-reference-record-specification-type
export class ReferenceRecord {
  readonly Base:
    | Record<PropertyKey, unknown>
    | EnvironmentRecord
    | "unresolvable";
  readonly ReferenceName: PropertyKey;
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
