import type {
  ArrayPattern,
  ArrowFunctionExpression,
  CallExpression,
  CatchClause,
  DoWhileStatement,
  Expression,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  LVal,
  NewExpression,
  ObjectPattern,
  Pattern,
  PatternLike,
  RestElement,
  Statement,
  SwitchCase,
  TemplateLiteral,
  VariableDeclaration,
  WhileStatement,
} from "@babel/types";
import {
  ApplyStringOrNumericAssignment,
  CreateListIteratorRecord,
  ApplyStringOrNumericBinaryOperator,
  GetV,
  GetValue,
  InitializeReferencedBinding,
  IsPropertyReference,
  LoopContinues,
  PutValue,
  RequireObjectCoercible,
  ToPropertyKey,
  UpdateEmpty,
  ApplyUnaryOperator,
  GetIdentifierReference,
  ForDeclarationBindingInstantiation,
  CopyDataProperties,
} from "./context-free.js";
import {
  CompletionRecord,
  DebuggerCall,
  DebuggerNode,
  DebuggerReturn,
  DebuggerScope,
  DeclarativeEnvironment,
  ECMAScriptCode,
  Empty,
  Environment,
  EnvironmentRecord,
  ExecutionContext,
  FormalParameters,
  FunctionEnvironment,
  FunctionObject,
  IsConstructor,
  NormalCompletion,
  OptionalChainRef,
  ReferenceRecord,
  SourceNode,
  Mode,
  ThisMode,
} from "./ExecutionContext.js";
import type {
  EstreeLVal,
  EstreeNode,
  EstreeObjectExpression,
  EstreeObjectPattern,
  EstreeProperty,
  CookRules,
  FunctionDefinition,
} from "./interfaces.js";
import { sanitize, isAllowedConstructor } from "./sanitize.js";
import {
  collectBoundNames,
  collectScopedDeclarations,
  containsExpression,
} from "./traverse.js";

export interface CookOptions {
  rules?: CookRules;
  globalVariables?: Record<string, unknown>;
  hooks?: CookHooks;
  debug?: boolean;
  externalSourceForDebug?: boolean;
  ArrayConstructor?: typeof Array;
}

export interface CookHooks {
  beforeEvaluate?(node: EstreeNode): void;
  beforeCall?(node: EstreeNode): void;
  beforeBranch?(node: EstreeNode, branch: "if" | "else"): void;
}

interface EvaluateResult<T, TReturn> extends Iterator<T, TReturn> {
  [Symbol.iterator](): EvaluateResult<T, TReturn>;
}

type CompletionRecordResult<T = unknown> = EvaluateResult<T, CompletionRecord>;

const globalExecutionContextStack: ExecutionContext[] = [];

export function __dev_only_clearGlobalExecutionContextStack() {
  globalExecutionContextStack.length = 0;
}

export function __dev_only_getGlobalExecutionContextStack() {
  return globalExecutionContextStack;
}

/** For next-core internal usage only. */
export function cook(
  rootAst: FunctionDeclaration | Expression,
  codeSource: string,
  {
    rules,
    debug,
    externalSourceForDebug,
    globalVariables = {},
    // Allow debugger to override Array constructor.
    ArrayConstructor = Array,
    hooks = {},
  }: CookOptions = {}
): unknown {
  const expressionOnly = rootAst.type !== "FunctionDeclaration";

  function doSanitize(cooked: unknown) {
    if (!externalSourceForDebug) {
      sanitize(cooked);
    }
  }

  const rootEnv = new DeclarativeEnvironment(null);
  const rootContext = new ExecutionContext();
  rootContext.VariableEnvironment = rootEnv;
  rootContext.LexicalEnvironment = rootEnv;
  const executionContextStack = [rootContext];

  for (const [key, value] of Object.entries(globalVariables)) {
    rootEnv.CreateImmutableBinding(key, true);
    rootEnv.InitializeBinding(key, value);
  }

  const TemplateMap = new WeakMap<TemplateLiteral, string[]>();

  // https://tc39.es/ecma262/#sec-gettemplateobject
  function GetTemplateObject(templateLiteral: TemplateLiteral): string[] {
    const memo = TemplateMap.get(templateLiteral);
    if (memo) {
      return memo;
    }
    const rawObj = templateLiteral.quasis.map((quasi) => quasi.value.raw);
    const template = templateLiteral.quasis.map((quasi) => quasi.value.cooked!);
    Object.freeze(rawObj);
    Object.defineProperty(template, "raw", {
      value: rawObj,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    Object.freeze(template);
    TemplateMap.set(templateLiteral, template);
    return template;
  }

  let currentNode: EstreeNode | undefined;

  function* Evaluate(
    node: EstreeNode,
    optionalChainRef?: OptionalChainRef,
    forceYield?: boolean
  ): CompletionRecordResult {
    hooks.beforeEvaluate?.(node);
    currentNode = node;
    if (
      debug &&
      (forceYield ||
        (node.type.endsWith("Statement") &&
          !(
            node.type === "ExpressionStatement" &&
            (node.expression.type === "CallExpression" ||
              node.expression.type === "TaggedTemplateExpression")
          ) &&
          node.type !== "TryStatement" &&
          node.type !== "BlockStatement" &&
          node.type !== "DoWhileStatement" &&
          node.type !== "WhileStatement" &&
          node.type !== "ForStatement" &&
          node.type !== "ForInStatement" &&
          node.type !== "ForOfStatement"))
    ) {
      yield;
    }
    // Expressions:
    switch (node.type) {
      case "ArrayExpression": {
        // https://tc39.es/ecma262/#sec-array-initializer
        const array = new ArrayConstructor();
        for (const element of node.elements) {
          if (!element) {
            array.length += 1;
          } else if (element.type === "SpreadElement") {
            const spreadValues = GetValue(
              yield* Evaluate(element.argument)
            ) as unknown[];
            array.push(...spreadValues);
          } else {
            array.push(GetValue(yield* Evaluate(element)));
          }
        }
        return NormalCompletion(array);
      }
      case "ArrowFunctionExpression": {
        // https://tc39.es/ecma262/#sec-arrow-function-definitions
        ThrowIfFunctionIsInvalid(node);
        const closure = InstantiateArrowFunctionExpression(node);
        return NormalCompletion(closure);
      }
      case "BinaryExpression": {
        const leftRef = yield* Evaluate(node.left);
        const leftValue = GetValue(leftRef);
        const rightRef = yield* Evaluate(node.right);
        const rightValue = GetValue(rightRef);
        if (expressionOnly && (node.operator as unknown) === "|>") {
          // Minimal pipeline operator is supported only in expression-only mode.
          // See https://tc39.es/proposal-pipeline-operator
          // and https://github.com/tc39/proposal-pipeline-operator
          if (typeof rightValue !== "function") {
            const funcName = codeSource.substring(
              node.right.start!,
              node.right.end!
            );
            throw new TypeError(`${funcName} is not a function`);
          }
          let thisValue;
          if (rightRef instanceof ReferenceRecord) {
            if (IsPropertyReference(rightRef)) {
              thisValue = rightRef.Base;
            }
          }
          return NormalCompletion(
            (rightValue as unknown as Function).call(thisValue, leftValue)
          );
        }
        // https://tc39.es/ecma262/#sec-additive-operators
        const result = ApplyStringOrNumericBinaryOperator(
          leftValue as number,
          node.operator,
          rightValue as number
        );
        return NormalCompletion(result);
      }
      case "CallExpression": {
        // https://tc39.es/ecma262/#sec-function-calls
        const ref = (yield* Evaluate(node.callee, optionalChainRef))
          .Value as ReferenceRecord;
        const func = GetValue(ref) as Function;
        if (
          (func === undefined || func === null) &&
          (node.optional || optionalChainRef?.skipped)
        ) {
          optionalChainRef!.skipped = true;
          return NormalCompletion(undefined);
        }
        doSanitize(func);

        if (debug) yield;

        return yield* EvaluateCall(func, ref, node.arguments, node.callee);
      }
      case "ChainExpression":
        // https://tc39.es/ecma262/#sec-optional-chains
        return yield* Evaluate(node.expression, {});
      case "ConditionalExpression":
        // https://tc39.es/ecma262/#sec-conditional-operator
        return NormalCompletion(
          GetValue(
            yield* Evaluate(
              GetValue(yield* Evaluate(node.test))
                ? node.consequent
                : node.alternate
            )
          )
        );
      case "Identifier":
        // https://tc39.es/ecma262/#sec-identifiers
        return NormalCompletion(ResolveBinding(node.name));
      case "Literal": {
        // https://tc39.es/ecma262/#sec-primary-expression-literals
        if (node.regex) {
          if (node.value === null) {
            // Invalid regular expression fails silently in @babel/parser.
            throw new SyntaxError(`Invalid regular expression: ${node.raw}`);
          }
          if (node.regex.flags.includes("u")) {
            // Currently unicode flag is not fully supported across major browsers.
            throw new SyntaxError(
              `Unsupported unicode flag in regular expression: ${node.raw}`
            );
          }
        }
        return NormalCompletion(node.value);
      }
      case "LogicalExpression": {
        // https://tc39.es/ecma262/#sec-binary-logical-operators
        const leftValue = GetValue(yield* Evaluate(node.left));
        switch (node.operator) {
          case "&&":
            return NormalCompletion(
              leftValue && GetValue(yield* Evaluate(node.right))
            );
          case "||":
            return NormalCompletion(
              leftValue || GetValue(yield* Evaluate(node.right))
            );
          case "??":
            return NormalCompletion(
              leftValue ?? GetValue(yield* Evaluate(node.right))
            );
          // istanbul ignore next
          default:
            throw new SyntaxError(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore never reach here.
              `Unsupported logical operator '${node.operator}'`
            );
        }
      }
      case "MemberExpression": {
        // https://tc39.es/ecma262/#sec-property-accessors
        const baseReference = (yield* Evaluate(node.object, optionalChainRef))
          .Value as ReferenceRecord;
        const baseValue = GetValue(baseReference) as Record<
          PropertyKey,
          unknown
        >;
        if (
          (baseValue === undefined || baseValue === null) &&
          (node.optional || optionalChainRef?.skipped)
        ) {
          optionalChainRef!.skipped = true;
          return NormalCompletion(undefined);
        }
        doSanitize(baseValue);
        const result = node.computed
          ? yield* EvaluatePropertyAccessWithExpressionKey(
              baseValue,
              node.property as Expression,
              true
            )
          : EvaluatePropertyAccessWithIdentifierKey(
              baseValue,
              node.property as Identifier,
              true
            );
        doSanitize(result);
        return NormalCompletion(result);
      }
      case "NewExpression":
        // https://tc39.es/ecma262/#sec-new-operator
        return yield* EvaluateNew(node.callee, node.arguments);
      case "ObjectExpression": {
        // https://tc39.es/ecma262/#sec-object-initializer
        const object: Record<PropertyKey, unknown> = {};
        for (const prop of (node as EstreeObjectExpression).properties) {
          if (prop.type === "SpreadElement") {
            const fromValue = GetValue(yield* Evaluate(prop.argument));
            CopyDataProperties(object, fromValue, new Set());
          } else {
            if (prop.kind !== "init") {
              throw new SyntaxError("Unsupported object getter/setter");
            }
            const propName =
              !prop.computed && prop.key.type === "Identifier"
                ? prop.key.name
                : yield* EvaluateComputedPropertyName(prop.key as Expression);
            if (propName === "__proto__") {
              throw new TypeError(
                "Setting '__proto__' property is not allowed"
              );
            }
            const propValue = GetValue(yield* Evaluate(prop.value));
            if (prop.method && typeof propValue === "function") {
              SetFunctionName(propValue as FunctionObject, propName as string);
            }
            object[propName] = propValue;
          }
        }
        return NormalCompletion(object);
      }
      case "SequenceExpression": {
        // https://tc39.es/ecma262/#sec-comma-operator
        let result: CompletionRecord | undefined;
        for (const expr of node.expressions) {
          result = NormalCompletion(GetValue(yield* Evaluate(expr)));
        }
        return result!;
      }
      case "TemplateLiteral": {
        // https://tc39.es/ecma262/#sec-template-literals
        const chunks: string[] = [node.quasis[0].value.cooked!];
        let index = 0;
        for (const expr of node.expressions) {
          const val = GetValue(yield* Evaluate(expr));
          chunks.push(String(val));
          chunks.push(node.quasis[(index += 1)].value.cooked!);
        }
        return NormalCompletion(chunks.join(""));
      }
      case "TaggedTemplateExpression": {
        // https://tc39.es/ecma262/#sec-tagged-templates
        const tagRef = (yield* Evaluate(node.tag)).Value as ReferenceRecord;
        const tagFunc = GetValue(tagRef) as Function;
        doSanitize(tagFunc);
        if (debug) yield;
        return yield* EvaluateCall(tagFunc, tagRef, node.quasi, node.tag);
      }
      case "UnaryExpression": {
        // https://tc39.es/ecma262/#sec-unary-operators
        const ref = (yield* Evaluate(node.argument)).Value as ReferenceRecord;
        if (!expressionOnly && node.operator === "delete") {
          // Delete operator is supported only in function mode.
          if (!(ref instanceof ReferenceRecord)) {
            return NormalCompletion(true);
          }
          // istanbul ignore else
          if (IsPropertyReference(ref)) {
            const deleteStatus = delete (
              ref.Base as Record<PropertyKey, unknown>
            )[ref.ReferenceName];
            return NormalCompletion(deleteStatus);
          }
          // Should never reach here in strict mode.
        }
        if (node.operator === "typeof") {
          if (ref instanceof ReferenceRecord && ref.Base === "unresolvable") {
            return NormalCompletion("undefined");
          }
          return NormalCompletion(typeof GetValue(ref));
        }
        return NormalCompletion(
          ApplyUnaryOperator(GetValue(ref), node.operator)
        );
      }
    }
    if (!expressionOnly) {
      // Statements and assignments:
      switch (node.type) {
        case "AssignmentExpression": {
          // https://tc39.es/ecma262/#sec-assignment-operators
          if (node.operator === "=") {
            if (
              !(
                node.left.type === "ArrayPattern" ||
                node.left.type === "ObjectPattern"
              )
            ) {
              const lref = (yield* Evaluate(node.left))
                .Value as ReferenceRecord;
              let rval: unknown;
              if (
                IsAnonymousFunctionDefinition(node.right) &&
                node.left.type === "Identifier"
              ) {
                rval = NamedEvaluation(node.right, node.left.name);
              } else {
                const rref = yield* Evaluate(node.right);
                rval = GetValue(rref);
              }
              PutValue(lref, rval);
              return NormalCompletion(rval);
            }
            const rref = yield* Evaluate(node.right);
            const rval = GetValue(rref) as string | number;
            yield* DestructuringAssignmentEvaluation(node.left, rval);
            return NormalCompletion(rval);
          }
          // Operators other than `=`.
          const lref = (yield* Evaluate(node.left)).Value as ReferenceRecord;
          const lval = GetValue(lref) as string | number;
          const rref = yield* Evaluate(node.right);
          const rval = GetValue(rref) as string | number;
          const r = ApplyStringOrNumericAssignment(lval, node.operator, rval);
          PutValue(lref, r);
          return NormalCompletion(r);
        }
        case "BlockStatement": {
          // https://tc39.es/ecma262/#sec-block
          if (!node.body.length) {
            return NormalCompletion(Empty);
          }
          const oldEnv = getRunningContext().LexicalEnvironment;
          const blockEnv = new DeclarativeEnvironment(oldEnv);
          BlockDeclarationInstantiation(node.body, blockEnv);
          getRunningContext().LexicalEnvironment = blockEnv;
          const blockValue = yield* EvaluateStatementList(node.body);
          getRunningContext().LexicalEnvironment = oldEnv;
          return blockValue;
        }
        case "BreakStatement":
          // https://tc39.es/ecma262/#sec-break-statement
          return new CompletionRecord("break", Empty);
        case "ContinueStatement":
          // https://tc39.es/ecma262/#sec-continue-statement
          return new CompletionRecord("continue", Empty);
        case "EmptyStatement":
          // https://tc39.es/ecma262/#sec-empty-statement
          return NormalCompletion(Empty);
        case "DoWhileStatement":
          // https://tc39.es/ecma262/#sec-do-while-statement
          return EvaluateBreakableStatement(yield* DoWhileLoopEvaluation(node));
        case "ExpressionStatement":
        case "TSAsExpression":
          // https://tc39.es/ecma262/#sec-expression-statement
          return yield* Evaluate(node.expression);
        case "ForInStatement":
        case "ForOfStatement":
          // https://tc39.es/ecma262/#sec-for-in-and-for-of-statements
          return EvaluateBreakableStatement(yield* ForInOfLoopEvaluation(node));
        case "ForStatement":
          // https://tc39.es/ecma262/#sec-for-statement
          return EvaluateBreakableStatement(yield* ForLoopEvaluation(node));
        case "FunctionDeclaration":
          // https://tc39.es/ecma262/#sec-function-definitions
          return NormalCompletion(Empty);
        case "FunctionExpression":
          // https://tc39.es/ecma262/#sec-function-defining-expressions
          ThrowIfFunctionIsInvalid(node);
          return NormalCompletion(InstantiateOrdinaryFunctionExpression(node));
        case "IfStatement":
          // https://tc39.es/ecma262/#sec-if-statement
          if (GetValue(yield* Evaluate(node.test))) {
            hooks.beforeBranch?.(node, "if");
            return UpdateEmpty(yield* Evaluate(node.consequent), undefined);
          }
          hooks.beforeBranch?.(node, "else");
          if (node.alternate) {
            return UpdateEmpty(yield* Evaluate(node.alternate), undefined);
          }
          return NormalCompletion(undefined);
        case "ReturnStatement": {
          // https://tc39.es/ecma262/#sec-return-statement
          let v: unknown;
          if (node.argument) {
            const exprRef = yield* Evaluate(node.argument);
            v = GetValue(exprRef);
          }
          return new CompletionRecord("return", v);
        }
        case "ThisExpression": {
          if (!externalSourceForDebug) {
            break;
          }
          const envRec = GetThisEnvironment();
          return NormalCompletion(envRec.GetThisBinding());
        }
        case "ThrowStatement":
          // https://tc39.es/ecma262/#sec-throw-statement
          throw GetValue(yield* Evaluate(node.argument));
        case "UpdateExpression": {
          // https://tc39.es/ecma262/#sec-update-expressions
          const lhs = (yield* Evaluate(node.argument)).Value as ReferenceRecord;
          const oldValue = Number(GetValue(lhs));
          const newValue = node.operator === "++" ? oldValue + 1 : oldValue - 1;
          PutValue(lhs, newValue);
          return NormalCompletion(node.prefix ? newValue : oldValue);
        }
        case "SwitchCase":
          return yield* EvaluateStatementList(node.consequent);
        case "SwitchStatement": {
          // https://tc39.es/ecma262/#sec-switch-statement
          const exprRef = yield* Evaluate(node.discriminant);
          const switchValue = GetValue(exprRef);
          const oldEnv = getRunningContext().LexicalEnvironment;
          const blockEnv = new DeclarativeEnvironment(oldEnv);
          BlockDeclarationInstantiation(node.cases, blockEnv);
          getRunningContext().LexicalEnvironment = blockEnv;
          const R = yield* CaseBlockEvaluation(node.cases, switchValue);
          getRunningContext().LexicalEnvironment = oldEnv;
          return EvaluateBreakableStatement(R);
        }
        case "TryStatement": {
          // https://tc39.es/ecma262/#sec-try-statement
          let R: CompletionRecord;
          try {
            R = yield* Evaluate(node.block);
          } catch (error) {
            if (node.handler) {
              currentNode = node.handler;
              hooks.beforeEvaluate?.(node.handler);
              R = yield* CatchClauseEvaluation(node.handler, error);
            } else {
              throw error;
            }
          } finally {
            if (node.finalizer) {
              const F = yield* Evaluate(node.finalizer);
              if (F.Type !== "normal") {
                R = F;
              }
            }
          }
          return R;
        }
        case "VariableDeclaration": {
          // https://tc39.es/ecma262/#sec-declarations-and-the-variable-statement
          let result: CompletionRecord | undefined;
          for (const declarator of node.declarations) {
            currentNode = declarator;
            if (!declarator.init) {
              // Assert: a declarator without init is always an identifier.
              if (node.kind === "var") {
                result = NormalCompletion(Empty);
              } else {
                const lhs = ResolveBinding((declarator.id as Identifier).name);
                result = InitializeReferencedBinding(lhs, undefined);
              }
            } else if (declarator.id.type === "Identifier") {
              currentNode = declarator.init;
              if (
                debug &&
                currentNode.type !== "CallExpression" &&
                currentNode.type !== "TaggedTemplateExpression"
              )
                yield;
              const bindingId = declarator.id.name;
              const lhs = ResolveBinding(bindingId);
              let value: unknown;
              if (IsAnonymousFunctionDefinition(declarator.init)) {
                value = NamedEvaluation(declarator.init, bindingId);
              } else {
                const rhs = yield* Evaluate(declarator.init);
                value = GetValue(rhs);
              }
              result =
                node.kind === "var"
                  ? PutValue(lhs, value)
                  : InitializeReferencedBinding(lhs, value);
            } else {
              currentNode = declarator.init;
              if (
                debug &&
                currentNode.type !== "CallExpression" &&
                currentNode.type !== "TaggedTemplateExpression"
              )
                yield;
              const rhs = yield* Evaluate(declarator.init);
              const rval = GetValue(rhs);
              result = yield* BindingInitialization(
                declarator.id,
                rval,
                node.kind === "var"
                  ? undefined
                  : getRunningContext().LexicalEnvironment
              );
            }
          }
          return result!;
        }
        case "WhileStatement":
          // https://tc39.es/ecma262/#sec-while-statement
          return EvaluateBreakableStatement(yield* WhileLoopEvaluation(node));
      }
    }
    // eslint-disable-next-line no-console
    throw new SyntaxError(`Unsupported node type \`${node.type}\``);
  }

  // https://tc39.es/ecma262/#sec-execution-contexts
  function getRunningContext(): ExecutionContext {
    return executionContextStack[executionContextStack.length - 1];
  }

  // https://tc39.es/ecma262/#sec-resolvebinding
  function ResolveBinding(
    name: string,
    env?: EnvironmentRecord
  ): ReferenceRecord {
    if (!env) {
      env = getRunningContext().LexicalEnvironment;
    }
    return GetIdentifierReference(env, name, true);
  }

  // Try statements.
  // https://tc39.es/ecma262/#sec-runtime-semantics-catchclauseevaluation
  function* CatchClauseEvaluation(
    node: CatchClause,
    thrownValue: unknown
  ): CompletionRecordResult {
    if (!node.param) {
      return yield* Evaluate(node.body);
    }
    const oldEnv = getRunningContext().LexicalEnvironment;
    const catchEnv = new DeclarativeEnvironment(oldEnv);
    for (const argName of collectBoundNames(node.param)) {
      catchEnv.CreateMutableBinding(argName, false);
    }
    getRunningContext().LexicalEnvironment = catchEnv;
    yield* BindingInitialization(node.param, thrownValue, catchEnv);
    const B = yield* Evaluate(node.body);
    getRunningContext().LexicalEnvironment = oldEnv;
    return B;
  }

  // Iteration statements and switch statements.
  // https://tc39.es/ecma262/#prod-BreakableStatement
  function EvaluateBreakableStatement(
    stmtResult: CompletionRecord
  ): CompletionRecord {
    return stmtResult.Type === "break"
      ? stmtResult.Value === Empty
        ? NormalCompletion(undefined)
        : NormalCompletion(stmtResult.Value)
      : stmtResult;
  }

  // Switch statements.
  // https://tc39.es/ecma262/#sec-runtime-semantics-caseblockevaluation
  function* CaseBlockEvaluation(
    cases: SwitchCase[],
    input: unknown
  ): CompletionRecordResult {
    let V: unknown;

    const defaultCaseIndex = cases.findIndex((switchCase) => !switchCase.test);
    const hasDefaultCase = defaultCaseIndex >= 0;
    const A = hasDefaultCase ? cases.slice(0, defaultCaseIndex) : cases;
    let found = false;
    for (const C of A) {
      if (!found) {
        found = yield* CaseClauseIsSelected(C, input);
      }
      if (found) {
        const R = yield* Evaluate(C);
        if (R.Value !== Empty) {
          V = R.Value;
        }
        if (R.Type !== "normal") {
          return UpdateEmpty(R, V);
        }
      }
    }

    if (!hasDefaultCase) {
      return NormalCompletion(V);
    }

    let foundInB = false;
    const B = cases.slice(defaultCaseIndex + 1);
    if (!found) {
      for (const C of B) {
        if (!foundInB) {
          foundInB = yield* CaseClauseIsSelected(C, input);
        }
        if (foundInB) {
          const R = yield* Evaluate(C);
          if (R.Value !== Empty) {
            V = R.Value;
          }
          if (R.Type !== "normal") {
            return UpdateEmpty(R, V);
          }
        }
      }
    }

    if (foundInB) {
      return NormalCompletion(V);
    }
    const R = yield* Evaluate(cases[defaultCaseIndex]);
    if (R.Value !== Empty) {
      V = R.Value;
    }
    if (R.Type !== "normal") {
      return UpdateEmpty(R, V);
    }

    // NOTE: The following is another complete iteration of the second CaseClauses.
    for (const C of B) {
      const R = yield* Evaluate(C);
      if (R.Value !== Empty) {
        V = R.Value;
      }
      if (R.Type !== "normal") {
        return UpdateEmpty(R, V);
      }
    }
    return NormalCompletion(V);
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-caseclauseisselected
  function* CaseClauseIsSelected(
    C: SwitchCase,
    input: unknown
  ): EvaluateResult<unknown, boolean> {
    const clauseSelector = GetValue(yield* Evaluate(C.test!));
    return input === clauseSelector;
  }

  // While statements.
  // https://tc39.es/ecma262/#sec-runtime-semantics-whileloopevaluation
  function* WhileLoopEvaluation(node: WhileStatement): CompletionRecordResult {
    let V: unknown;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exprValue = GetValue(yield* Evaluate(node.test, undefined, true));
      if (!exprValue) {
        return NormalCompletion(V);
      }
      const stmtResult = yield* Evaluate(node.body);
      if (!LoopContinues(stmtResult)) {
        return UpdateEmpty(stmtResult, V);
      }
      if (stmtResult.Value !== Empty) {
        V = stmtResult.Value;
      }
    }
  }

  // Do-while Statements.
  // https://tc39.es/ecma262/#sec-runtime-semantics-dowhileloopevaluation
  function* DoWhileLoopEvaluation(
    node: DoWhileStatement
  ): CompletionRecordResult {
    let V: unknown;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const stmtResult = yield* Evaluate(node.body);
      if (!LoopContinues(stmtResult)) {
        return UpdateEmpty(stmtResult, V);
      }
      if (stmtResult.Value !== Empty) {
        V = stmtResult.Value;
      }
      const exprValue = GetValue(yield* Evaluate(node.test, undefined, true));
      if (!exprValue) {
        return NormalCompletion(V);
      }
    }
  }

  // For in/of statements.
  // https://tc39.es/ecma262/#sec-runtime-semantics-forinofloopevaluation
  function* ForInOfLoopEvaluation(
    node: ForInStatement | ForOfStatement
  ): CompletionRecordResult {
    const lhs = node.left;
    const isVariableDeclaration = lhs.type === "VariableDeclaration";
    const lhsKind = isVariableDeclaration
      ? lhs.kind === "var"
        ? "varBinding"
        : "lexicalBinding"
      : "assignment";
    const uninitializedBoundNames =
      lhsKind === "lexicalBinding" ? collectBoundNames(lhs) : [];
    const iterationKind =
      node.type === "ForInStatement" ? "enumerate" : "iterate";
    const keyResult = yield* ForInOfHeadEvaluation(
      uninitializedBoundNames,
      node.right,
      iterationKind
    );
    if (keyResult.Type !== "normal") {
      // When enumerate, if the target is nil, a break completion will be returned.
      return keyResult;
    }
    return yield* ForInOfBodyEvaluation(
      lhs,
      node.body,
      keyResult.Value as Iterator<unknown>,
      iterationKind,
      lhsKind
    );
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-forinofheadevaluation
  function* ForInOfHeadEvaluation(
    uninitializedBoundNames: string[],
    expr: Expression,
    iterationKind: "enumerate" | "iterate"
  ): CompletionRecordResult {
    const runningContext = getRunningContext();
    const oldEnv = runningContext.LexicalEnvironment;
    if (uninitializedBoundNames.length > 0) {
      const newEnv = new DeclarativeEnvironment(oldEnv);
      for (const name of uninitializedBoundNames) {
        newEnv.CreateMutableBinding(name, false);
      }
      runningContext.LexicalEnvironment = newEnv;
    }
    const exprRef = yield* Evaluate(expr, undefined, true);
    runningContext.LexicalEnvironment = oldEnv;
    const exprValue = GetValue(exprRef);
    if (iterationKind === "enumerate") {
      if (exprValue === null || exprValue === undefined) {
        return new CompletionRecord("break", Empty);
      }
      const iterator = EnumerateObjectProperties(exprValue);
      return NormalCompletion(iterator);
    }
    const iterator = CreateListIteratorRecord(exprValue as Iterable<unknown>);
    return NormalCompletion(iterator);
  }

  function* ForInOfBodyEvaluation(
    node: VariableDeclaration | EstreeLVal,
    stmt: Statement,
    iteratorRecord: Iterator<unknown>,
    iterationKind: "enumerate" | "iterate",
    lhsKind: "varBinding" | "lexicalBinding" | "assignment"
  ): CompletionRecordResult {
    const lhs =
      lhsKind === "assignment"
        ? (node as EstreeLVal)
        : (node as VariableDeclaration).declarations[0].id;
    const oldEnv = getRunningContext().LexicalEnvironment;
    let V: unknown;
    // When `destructuring` is false,
    // For `node` whose `kind` is assignment:
    //   `lhs` is an `Identifier` or a `MemberExpression`,
    // Otherwise:
    //   `lhs` is an `Identifier`.
    const destructuring =
      lhs.type === "ObjectPattern" || lhs.type === "ArrayPattern";
    // eslint-disable-next-line no-constant-condition
    while (true) {
      currentNode = lhs;
      const { done, value: nextValue } = iteratorRecord.next();
      if (done) {
        if (debug) yield;
        return NormalCompletion(V);
      }
      let lhsRef: ReferenceRecord | undefined;
      let iterationEnv: DeclarativeEnvironment | undefined;
      if (lhsKind === "lexicalBinding") {
        iterationEnv = new DeclarativeEnvironment(oldEnv);
        ForDeclarationBindingInstantiation(
          node as VariableDeclaration,
          iterationEnv
        );
        getRunningContext().LexicalEnvironment = iterationEnv;
        if (debug) yield;
        if (!destructuring) {
          const [lhsName] = collectBoundNames(lhs);
          lhsRef = ResolveBinding(lhsName);
        }
      } else {
        if (debug) yield;
        if (!destructuring) {
          lhsRef = (yield* Evaluate(lhs)).Value as ReferenceRecord;
        }
      }

      destructuring
        ? lhsKind === "assignment"
          ? yield* DestructuringAssignmentEvaluation(lhs, nextValue)
          : lhsKind === "varBinding"
            ? yield* BindingInitialization(lhs, nextValue, undefined)
            : yield* BindingInitialization(lhs, nextValue, iterationEnv)
        : lhsKind === "lexicalBinding"
          ? InitializeReferencedBinding(lhsRef!, nextValue)
          : PutValue(lhsRef!, nextValue);

      const result = yield* Evaluate(stmt);
      getRunningContext().LexicalEnvironment = oldEnv;
      if (!LoopContinues(result)) {
        const status = UpdateEmpty(result, V);
        if (
          !(
            iterationKind === "enumerate" || iteratorRecord.return === undefined
          )
        ) {
          // Perform *IteratorClose*
          // https://tc39.es/ecma262/#sec-iteratorclose
          const innerResult = iteratorRecord.return();
          if (
            !innerResult ||
            !["object", "function"].includes(typeof innerResult)
          ) {
            throw new TypeError(`Iterator result is not an object`);
          }
        }
        return status;
      }
      if (result.Value !== Empty) {
        V = result.Value;
      }
    }
  }

  // https://tc39.es/ecma262/#sec-enumerate-object-properties
  function* EnumerateObjectProperties(value: any): Iterator<PropertyKey> {
    for (const key in value) {
      yield key;
    }
  }

  // For statements.
  // https://tc39.es/ecma262/#sec-runtime-semantics-forloopevaluation
  function* ForLoopEvaluation(node: ForStatement): CompletionRecordResult {
    if (node.init?.type === "VariableDeclaration") {
      // `for (var … ; … ; … ) …`
      if (node.init.kind === "var") {
        yield* Evaluate(node.init);
        return yield* ForBodyEvaluation(node.test, node.update, node.body, []);
      }
      // `for (let/const … ; … ; … ) …`
      const oldEnv = getRunningContext().LexicalEnvironment;
      const loopEnv = new DeclarativeEnvironment(oldEnv);
      const isConst = node.init.kind === "const";
      const boundNames = collectBoundNames(node.init);
      for (const dn of boundNames) {
        if (isConst) {
          loopEnv.CreateImmutableBinding(dn, true);
        } else {
          loopEnv.CreateMutableBinding(dn, false);
        }
      }
      getRunningContext().LexicalEnvironment = loopEnv;
      yield* Evaluate(node.init);
      const perIterationLets = isConst ? [] : Array.from(boundNames);
      const bodyResult = yield* ForBodyEvaluation(
        node.test,
        node.update,
        node.body,
        perIterationLets
      );
      getRunningContext().LexicalEnvironment = oldEnv;
      return bodyResult;
    }
    // `for ( … ; … ; … ) …`
    if (node.init) {
      const exprRef = yield* Evaluate(node.init);
      GetValue(exprRef);
    }
    return yield* ForBodyEvaluation(node.test, node.update, node.body, []);
  }

  // https://tc39.es/ecma262/#sec-forbodyevaluation
  function* ForBodyEvaluation(
    test: Expression | null | undefined,
    increment: Expression | null | undefined,
    stmt: Statement,
    perIterationBindings: string[]
  ): CompletionRecordResult {
    CreatePerIterationEnvironment(perIterationBindings);
    let V: unknown;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (test) {
        const testRef = yield* Evaluate(test, undefined, true);
        const testValue = GetValue(testRef);
        if (!testValue) {
          return NormalCompletion(V);
        }
      }
      const result = yield* Evaluate(stmt);
      if (!LoopContinues(result)) {
        return UpdateEmpty(result, V);
      }
      if (result.Value) {
        V = result.Value;
      }
      CreatePerIterationEnvironment(perIterationBindings);
      if (increment) {
        const incRef = yield* Evaluate(increment, undefined, true);
        GetValue(incRef);
      }
    }
  }

  // https://tc39.es/ecma262/#sec-createperiterationenvironment
  function CreatePerIterationEnvironment(
    perIterationBindings: string[]
  ): unknown {
    if (perIterationBindings.length === 0) {
      return;
    }
    const lastIterationEnv = getRunningContext().LexicalEnvironment!;
    const outer = lastIterationEnv.OuterEnv;
    const thisIterationEnv = new DeclarativeEnvironment(outer);
    for (const bn of perIterationBindings) {
      thisIterationEnv.CreateMutableBinding(bn, false);
      const lastValue = lastIterationEnv.GetBindingValue(bn, false);
      thisIterationEnv.InitializeBinding(bn, lastValue);
    }
    getRunningContext().LexicalEnvironment = thisIterationEnv;
  }

  // Destructuring assignments.
  // https://tc39.es/ecma262/#sec-runtime-semantics-destructuringassignmentevaluation
  function* DestructuringAssignmentEvaluation(
    pattern: ObjectPattern | EstreeObjectPattern | ArrayPattern,
    value: unknown
  ): CompletionRecordResult {
    if (pattern.type === "ObjectPattern") {
      RequireObjectCoercible(value);
      if (pattern.properties.length > 0) {
        yield* PropertyDestructuringAssignmentEvaluation(
          (pattern as EstreeObjectPattern).properties,
          value
        );
      }
      return NormalCompletion(Empty);
    }
    const iteratorRecord = CreateListIteratorRecord(value as Iterable<unknown>);
    return yield* IteratorDestructuringAssignmentEvaluation(
      pattern.elements,
      iteratorRecord
    );
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-propertydestructuringassignmentevaluation
  function* PropertyDestructuringAssignmentEvaluation(
    properties: (EstreeProperty | RestElement)[],
    value: unknown
  ): EvaluateResult<unknown, void> {
    const excludedNames = new Set<PropertyKey>();
    for (const prop of properties) {
      if (prop.type === "Property") {
        const propName =
          !prop.computed && prop.key.type === "Identifier"
            ? prop.key.name
            : ((yield* EvaluateComputedPropertyName(
                prop.key as Expression
              )) as string);
        const valueTarget =
          prop.value.type === "AssignmentPattern"
            ? prop.value.left
            : prop.value;
        if (valueTarget.type === "Identifier") {
          const lref = ResolveBinding(valueTarget.name);
          let v = GetV(value, propName);
          if (prop.value.type === "AssignmentPattern" && v === undefined) {
            if (IsAnonymousFunctionDefinition(prop.value.right)) {
              v = NamedEvaluation(prop.value.right, valueTarget.name);
            } else {
              const defaultValue = yield* Evaluate(prop.value.right);
              v = GetValue(defaultValue);
            }
          }
          PutValue(lref, v);
          excludedNames.add(propName);
        } else {
          yield* KeyedDestructuringAssignmentEvaluation(
            prop.value,
            value,
            propName
          );
          excludedNames.add(propName);
        }
      } else {
        yield* RestDestructuringAssignmentEvaluation(
          prop,
          value,
          excludedNames
        );
      }
    }
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-keyeddestructuringassignmentevaluation
  function* KeyedDestructuringAssignmentEvaluation(
    node: EstreeNode,
    value: unknown,
    propertyName: PropertyKey
  ): CompletionRecordResult {
    const assignmentTarget =
      node.type === "AssignmentPattern" ? node.left : node;
    const isObjectOrArray =
      assignmentTarget.type === "ArrayPattern" ||
      assignmentTarget.type === "ObjectPattern";
    let lref: ReferenceRecord | undefined;
    if (!isObjectOrArray) {
      lref = (yield* Evaluate(assignmentTarget)).Value as ReferenceRecord;
    }
    const v = GetV(value, propertyName);
    let rhsValue;
    if (node.type === "AssignmentPattern" && v === undefined) {
      // `assignmentTarget.type` is never "Identifier" here.
      const defaultValue = yield* Evaluate(node.right);
      rhsValue = GetValue(defaultValue);
    } else {
      rhsValue = v;
    }
    if (isObjectOrArray) {
      return yield* DestructuringAssignmentEvaluation(
        assignmentTarget,
        rhsValue
      );
    }
    return PutValue(lref!, rhsValue);
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-restdestructuringassignmentevaluation
  function* RestDestructuringAssignmentEvaluation(
    restProperty: RestElement,
    value: unknown,
    excludedNames: Set<PropertyKey>
  ): CompletionRecordResult {
    const lref = (yield* Evaluate(restProperty.argument))
      .Value as ReferenceRecord;
    const restObj = CopyDataProperties({}, value, excludedNames);
    return PutValue(lref, restObj);
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-iteratordestructuringassignmentevaluation
  function* IteratorDestructuringAssignmentEvaluation(
    elements: (PatternLike | LVal | null)[],
    iteratorRecord: Iterator<unknown>
  ): CompletionRecordResult {
    let status = NormalCompletion(Empty);
    for (const element of elements) {
      if (!element) {
        iteratorRecord.next();
        status = NormalCompletion(Empty);
        continue;
      }
      const assignmentTarget =
        element.type === "RestElement"
          ? element.argument
          : element.type === "AssignmentPattern"
            ? element.left
            : element;
      const isObjectOrArray =
        assignmentTarget.type === "ArrayPattern" ||
        assignmentTarget.type === "ObjectPattern";
      let lref: ReferenceRecord | undefined;
      if (!isObjectOrArray) {
        lref = (yield* Evaluate(assignmentTarget)).Value as ReferenceRecord;
      }
      let v: unknown;
      if (element.type !== "RestElement") {
        const { done, value: nextValue } = iteratorRecord.next();
        const value = done ? undefined : nextValue;
        if (element.type === "AssignmentPattern" && value === undefined) {
          if (
            IsAnonymousFunctionDefinition(element.right) &&
            assignmentTarget.type === "Identifier"
          ) {
            v = NamedEvaluation(element.right, assignmentTarget.name);
          } else {
            const defaultValue = yield* Evaluate(element.right);
            v = GetValue(defaultValue);
          }
        } else {
          v = value;
        }
      } else {
        // RestElement
        v = new ArrayConstructor();
        let n = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value: nextValue } = iteratorRecord.next();
          if (done) {
            break;
          }
          (v as unknown[])[n] = nextValue;
          n++;
        }
      }
      if (isObjectOrArray) {
        status = yield* DestructuringAssignmentEvaluation(assignmentTarget, v);
      } else {
        status = PutValue(lref!, v);
      }
    }
    return status;
  }

  // Object expressions.
  // https://tc39.es/ecma262/#sec-evaluate-property-access-with-expression-key
  function* EvaluatePropertyAccessWithExpressionKey(
    baseValue: Record<PropertyKey, unknown>,
    expression: Expression,
    strict: boolean
  ): EvaluateResult<unknown, ReferenceRecord> {
    const propertyNameReference = yield* Evaluate(expression);
    const propertyNameValue = GetValue(propertyNameReference);
    const propertyKey = ToPropertyKey(propertyNameValue);
    return new ReferenceRecord(baseValue, propertyKey, strict);
  }

  // https://tc39.es/ecma262/#sec-evaluate-property-access-with-identifier-key
  function EvaluatePropertyAccessWithIdentifierKey(
    baseValue: Record<PropertyKey, unknown>,
    identifier: Identifier,
    strict: boolean
  ): ReferenceRecord {
    currentNode = identifier;
    const propertyNameString = identifier.name;
    return new ReferenceRecord(baseValue, propertyNameString, strict);
  }

  // Block statements.
  // https://tc39.es/ecma262/#sec-blockdeclarationinstantiation
  function BlockDeclarationInstantiation(
    code: Statement[] | SwitchCase[],
    env: EnvironmentRecord
  ): void {
    const declarations = collectScopedDeclarations(code, {
      var: false,
      topLevel: false,
    });
    for (const d of declarations) {
      const IsConstantDeclaration =
        d.type === "VariableDeclaration" && d.kind === "const";
      for (const dn of collectBoundNames(d)) {
        if (IsConstantDeclaration) {
          env.CreateImmutableBinding(dn, true);
        } else {
          env.CreateMutableBinding(dn, false);
        }
      }
      if (d.type === "FunctionDeclaration") {
        const [fn] = collectBoundNames(d);
        const fo = InstantiateFunctionObject(d, env);
        env.InitializeBinding(fn, fo);
      }
    }
  }

  // Function declarations and expressions.
  // https://tc39.es/ecma262/#sec-evaluatecall
  function* EvaluateCall(
    func: Function,
    ref: ReferenceRecord,
    args: CallExpression["arguments"] | TemplateLiteral,
    callee: CallExpression["callee"]
  ): CompletionRecordResult {
    let thisValue;
    if (ref instanceof ReferenceRecord) {
      if (IsPropertyReference(ref)) {
        thisValue = ref.Base;
      }
    }
    const argList = yield* ArgumentListEvaluation(args);
    if (typeof func !== "function") {
      const funcName = codeSource.substring(callee.start!, callee.end!);
      throw new TypeError(`${funcName} is not a function`);
    }

    if (debug || externalSourceForDebug) {
      const debuggerCall = (func as FunctionObject)[DebuggerCall];
      if (debuggerCall) {
        const result = yield* (debuggerCall as Function).apply(
          thisValue,
          argList
        );
        doSanitize(result);
        return NormalCompletion(result);
      }
    }

    const result = func.apply(thisValue, argList);
    doSanitize(result);
    return NormalCompletion(result);
  }

  // https://tc39.es/ecma262/#sec-evaluatenew
  function* EvaluateNew(
    constructExpr: CallExpression["callee"],
    args: NewExpression["arguments"]
  ): CompletionRecordResult {
    const ref = yield* Evaluate(constructExpr);
    const constructor = GetValue(ref) as new (...args: unknown[]) => unknown;
    const argList = yield* ArgumentListEvaluation(args);
    if (
      typeof constructor !== "function" ||
      (constructor as unknown as FunctionObject)[IsConstructor] === false
    ) {
      const constructorName = codeSource.substring(
        constructExpr.start!,
        constructExpr.end!
      );
      throw new TypeError(`${constructorName} is not a constructor`);
    }
    if (
      !externalSourceForDebug &&
      !isAllowedConstructor(constructor) &&
      constructor !== ArrayConstructor
    ) {
      const constructorName = codeSource.substring(
        constructExpr.start!,
        constructExpr.end!
      );
      throw new TypeError(`${constructorName} is not an allowed constructor`);
    }

    return NormalCompletion(new constructor(...argList));
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-argumentlistevaluation
  function* ArgumentListEvaluation(
    args: CallExpression["arguments"] | TemplateLiteral
  ): EvaluateResult<unknown, unknown[]> {
    const array: unknown[] = [];
    if (Array.isArray(args)) {
      for (const arg of args) {
        if (arg.type === "SpreadElement") {
          const spreadValues = GetValue(
            yield* Evaluate(arg.argument)
          ) as unknown[];
          array.push(...spreadValues);
        } else {
          array.push(GetValue(yield* Evaluate(arg)));
        }
      }
    } else {
      array.push(GetTemplateObject(args));
      for (const expr of args.expressions) {
        array.push(GetValue(yield* Evaluate(expr)));
      }
    }
    return array;
  }

  // https://tc39.es/ecma262/#sec-ecmascript-function-objects-call-thisargument-argumentslist
  function* CallFunction(
    closure: FunctionObject,
    thisArgument: unknown,
    args: Iterable<unknown>
  ): EvaluateResult<unknown, unknown> {
    hooks.beforeCall?.(closure[SourceNode]);
    const calleeContext = PrepareForOrdinaryCall(closure);
    OrdinaryCallBindThis(closure, calleeContext, thisArgument);
    const result = yield* OrdinaryCallEvaluateBody(closure, args);
    if (debug) {
      currentNode = {
        ...closure[SourceNode],
        [DebuggerReturn]: true,
      } as EstreeNode & {
        [DebuggerReturn]?: boolean;
      };
      yield {
        type: "return",
        value: result.Type === "return" ? result.Value : undefined,
      };
    }
    executionContextStack.pop();
    globalExecutionContextStack.pop();
    if (result.Type === "return") {
      return result.Value;
    }
    return undefined;
  }

  // https://tc39.es/ecma262/#sec-prepareforordinarycall
  function PrepareForOrdinaryCall(F: FunctionObject): ExecutionContext {
    const calleeContext = new ExecutionContext();
    calleeContext.Function = F;
    const localEnv = new FunctionEnvironment(F);
    calleeContext.VariableEnvironment = localEnv;
    calleeContext.LexicalEnvironment = localEnv;
    executionContextStack.push(calleeContext);
    globalExecutionContextStack.push(calleeContext);
    return calleeContext;
  }

  function OrdinaryCallBindThis(
    F: FunctionObject,
    calleeContext: ExecutionContext,
    thisArgument: unknown
  ) {
    if (F[ThisMode] === Mode.LEXICAL) {
      return;
    }
    const localEnv = calleeContext.LexicalEnvironment;
    (localEnv as FunctionEnvironment)?.BindThisValue(thisArgument);
  }

  // https://tc39.es/ecma262/#sec-ordinarycallevaluatebody
  function* OrdinaryCallEvaluateBody(
    F: FunctionObject,
    args: Iterable<unknown>
  ): CompletionRecordResult {
    return yield* EvaluateFunctionBody(F[ECMAScriptCode], F, args);
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-evaluatefunctionbody
  function* EvaluateFunctionBody(
    body: Statement[] | Expression,
    F: FunctionObject,
    args: Iterable<unknown>
  ): CompletionRecordResult {
    yield* FunctionDeclarationInstantiation(F, args);
    if (Array.isArray(body)) {
      return yield* EvaluateStatementList(body);
    }
    return new CompletionRecord("return", GetValue(yield* Evaluate(body)));
  }

  // https://tc39.es/ecma262/#sec-block-runtime-semantics-evaluation
  function* EvaluateStatementList(
    statements: Statement[]
  ): CompletionRecordResult {
    let result = NormalCompletion(Empty);
    for (const stmt of statements) {
      const s = yield* Evaluate(stmt);
      if (s.Type !== "normal") {
        return s;
      }
      result = UpdateEmpty(result, s.Value);
    }
    return result;
  }

  function GetThisEnvironment(): FunctionEnvironment {
    let env: EnvironmentRecord | null | undefined =
      getRunningContext().LexicalEnvironment;
    while (env) {
      if (env.HasThisBinding()) {
        return env as FunctionEnvironment;
      }
      env = env.OuterEnv;
    }
    throw new Error("Accessing global this is forbidden");
  }

  // https://tc39.es/ecma262/#sec-isanonymousfunctiondefinition
  function IsAnonymousFunctionDefinition(
    node: EstreeNode
  ): node is FunctionDefinition {
    // No ParenthesizedExpression in ESTree.
    return (
      (node.type === "FunctionExpression" && !node.id) ||
      node.type === "ArrowFunctionExpression"
    );
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-namedevaluation
  function NamedEvaluation(node: FunctionDefinition, name: string) {
    hooks.beforeEvaluate?.(node);
    // No ParenthesizedExpression in ESTree.
    switch (node.type) {
      case "FunctionExpression":
        return InstantiateOrdinaryFunctionExpression(node, name);
      case "ArrowFunctionExpression":
        return InstantiateArrowFunctionExpression(node, name);
      // istanbul ignore next: should never happen
      default:
        throw new Error(
          `Unexpected node type for NamedEvaluation: ${(node as FunctionDefinition).type}`
        );
    }
  }

  // https://tc39.es/ecma262/#sec-functiondeclarationinstantiation
  function* FunctionDeclarationInstantiation(
    func: FunctionObject,
    args: Iterable<unknown>
  ): EvaluateResult<unknown, void> {
    const calleeContext = getRunningContext();
    const code = func[ECMAScriptCode];
    const formals = func[FormalParameters] as FunctionDeclaration["params"];
    const parameterNames = collectBoundNames(formals);
    const hasParameterExpressions = containsExpression(formals);
    const varDeclarations = collectScopedDeclarations(code, {
      var: true,
      topLevel: true,
    });
    const varNames = collectBoundNames(varDeclarations);

    // `functionNames` ∈ `varNames`
    // `functionsToInitialize` ≈ `functionNames`
    const functionNames: string[] = [];
    const functionsToInitialize: FunctionDeclaration[] = [];
    for (let i = varDeclarations.length - 1; i >= 0; i--) {
      const d = varDeclarations[i];
      if (d.type === "FunctionDeclaration") {
        ThrowIfFunctionIsInvalid(d);
        const [fn] = collectBoundNames(d);
        if (!functionNames.includes(fn)) {
          functionNames.unshift(fn);
          functionsToInitialize.unshift(d);
        }
      } else if (rules?.noVar) {
        throw new SyntaxError(
          "Var declaration is not recommended, use `let` or `const` instead"
        );
      }
    }

    // let argumentsObjectNeeded = true;
    // if (func[ThisMode] === Mode.LEXICAL) {
    //   // NOTE: Arrow functions never have an arguments object.
    //   argumentsObjectNeeded = false;
    // } else if (parameterNames.includes("arguments")) {
    //   argumentsObjectNeeded = false;
    // } else if (!hasParameterExpressions && (
    //   varNames.includes("arguments") ||
    //   collectBoundNames(collectScopedDeclarations(code, { var: false })).includes("arguments")
    // )) {
    //   argumentsObjectNeeded = false;
    // }
    // NOTE: In strict mode, no parameter/function/var/lexical names can be "arguments".
    const argumentsObjectNeeded =
      !!externalSourceForDebug && func[ThisMode] !== Mode.LEXICAL;

    const env = calleeContext.LexicalEnvironment!;
    for (const paramName of parameterNames) {
      // In strict mode, it's guaranteed no duplicate params exist.
      env.CreateMutableBinding(paramName, false);
    }

    let parameterBindings = parameterNames;
    if (argumentsObjectNeeded) {
      const ao = CreateUnmappedArgumentsObject(args);
      env.CreateImmutableBinding("arguments", false);
      env.InitializeBinding("arguments", ao);
      parameterBindings = parameterNames.concat("arguments");
    }

    const iteratorRecord = CreateListIteratorRecord(args);
    yield* IteratorBindingInitialization(formals, iteratorRecord, env);

    let varEnv: EnvironmentRecord;
    if (!hasParameterExpressions) {
      // NOTE: Only a single Environment Record is needed for the parameters
      // and top-level vars.
      // `varNames` are unique.
      const instantiatedVarNames = [...parameterBindings];
      for (const n of varNames) {
        if (!instantiatedVarNames.includes(n)) {
          instantiatedVarNames.push(n);
          env.CreateMutableBinding(n, false);
          env.InitializeBinding(n, undefined);
        }
      }
      varEnv = env;
    } else {
      // NOTE: A separate Environment Record is needed to ensure that closures
      // created by expressions in the formal parameter list do not have
      // visibility of declarations in the function body.
      varEnv = new DeclarativeEnvironment(env);
      calleeContext.VariableEnvironment = varEnv;
      // `varNames` are unique.
      const instantiatedVarNames: string[] = [];
      for (const n of varNames) {
        if (!instantiatedVarNames.includes(n)) {
          instantiatedVarNames.push(n);
          varEnv.CreateMutableBinding(n, false);
          let initialValue: unknown;
          if (parameterBindings.includes(n) && !functionNames.includes(n)) {
            initialValue = env.GetBindingValue(n, false);
          }
          varEnv.InitializeBinding(n, initialValue);
          // NOTE: A var with the same name as a formal parameter initially has
          // the same value as the corresponding initialized parameter.
        }
      }
    }
    const lexEnv = varEnv;
    calleeContext.LexicalEnvironment = lexEnv;

    const lexDeclarations = collectScopedDeclarations(code, {
      var: false,
      topLevel: true,
    });
    for (const d of lexDeclarations) {
      for (const dn of collectBoundNames(d)) {
        // Only lexical VariableDeclaration here in top-level.
        if ((d as VariableDeclaration).kind === "const") {
          lexEnv.CreateImmutableBinding(dn, true);
        } else {
          lexEnv.CreateMutableBinding(dn, false);
        }
      }
    }

    for (const f of functionsToInitialize) {
      const [fn] = collectBoundNames(f);
      const fo = InstantiateFunctionObject(f, lexEnv);
      varEnv.SetMutableBinding(fn, fo, false);
    }
  }

  function CreateUnmappedArgumentsObject(args: Iterable<unknown>) {
    const argList = [...args];
    const argumentObject: Record<string, unknown> = {};
    Object.defineProperty(argumentObject, "length", {
      value: argList.length,
      writable: true,
      configurable: true,
    });
    for (let index = 0; index < argList.length; index++) {
      argumentObject[String(index)] = argList[index];
    }
    Object.defineProperty(argumentObject, Symbol.iterator, {
      value: Array.prototype.values,
      writable: true,
      configurable: true,
    });
    const ThrowTypeError = () => {
      throw new TypeError(
        "'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them"
      );
    };
    Object.defineProperty(argumentObject, "callee", {
      get: ThrowTypeError,
      set: ThrowTypeError,
    });
    return argumentObject;
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-instantiatefunctionobject
  function InstantiateFunctionObject(
    func: FunctionDeclaration,
    scope: EnvironmentRecord
  ): FunctionObject {
    const F = OrdinaryFunctionCreate(func, scope, true, false);

    if (func.id) {
      SetFunctionName(F, func.id.name);
    }

    return F;
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-instantiateordinaryfunctionexpression
  function InstantiateOrdinaryFunctionExpression(
    functionExpression: FunctionExpression,
    name?: string
  ): FunctionObject {
    const scope = getRunningContext().LexicalEnvironment!;
    if (functionExpression.id) {
      const name = functionExpression.id.name;
      const funcEnv = new DeclarativeEnvironment(scope);
      funcEnv.CreateImmutableBinding(name, false);
      const closure = OrdinaryFunctionCreate(
        functionExpression,
        funcEnv,
        true,
        false
      );
      SetFunctionName(closure, name);
      funcEnv.InitializeBinding(name, closure);
      return closure;
    } else {
      const closure = OrdinaryFunctionCreate(
        functionExpression,
        scope,
        true,
        false
      );
      SetFunctionName(closure, name ?? "");
      return closure;
    }
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-instantiatearrowfunctionexpression
  function InstantiateArrowFunctionExpression(
    arrowFunction: ArrowFunctionExpression,
    name?: string
  ): FunctionObject {
    const scope = getRunningContext().LexicalEnvironment!;
    const closure = OrdinaryFunctionCreate(arrowFunction, scope, false, true);
    SetFunctionName(closure, name ?? "");
    return closure;
  }

  function SetFunctionName(F: FunctionObject, name: string) {
    Object.defineProperty(F, "name", {
      value: name,
      configurable: true,
    });
  }

  // https://tc39.es/ecma262/#sec-ordinaryfunctioncreate
  function OrdinaryFunctionCreate(
    sourceNode:
      | FunctionDeclaration
      | FunctionExpression
      | ArrowFunctionExpression,
    scope: EnvironmentRecord,
    isConstructor: boolean,
    lexicalThis: boolean
  ): FunctionObject {
    const F = function (this: unknown) {
      // eslint-disable-next-line prefer-rest-params
      return unwind(CallFunction(F, this, arguments));
    } as FunctionObject;
    Object.defineProperties(F, {
      [SourceNode]: {
        value: sourceNode,
      },
      [FormalParameters]: {
        value: sourceNode.params,
      },
      [ECMAScriptCode]: {
        value:
          sourceNode.body.type === "BlockStatement"
            ? sourceNode.body.body
            : sourceNode.body,
      },
      [Environment]: {
        value: scope,
      },
      [IsConstructor]: {
        value: isConstructor,
      },
      [ThisMode]: {
        value: lexicalThis ? Mode.LEXICAL : Mode.STRICT,
      },
    });

    const len = ExpectedArgumentCount(sourceNode.params);
    Object.defineProperty(F, "length", {
      configurable: true,
      value: len,
    });

    if (debug || externalSourceForDebug) {
      Object.defineProperty(F, DebuggerCall, {
        value: function () {
          // eslint-disable-next-line prefer-rest-params
          return CallFunction(F, this, arguments);
        },
      });
    }
    return F;
  }

  function ExpectedArgumentCount(
    params: (Identifier | Pattern | RestElement)[]
  ) {
    let count = 0;
    for (const param of params) {
      switch (param.type) {
        case "AssignmentPattern":
        case "RestElement":
          return count;
        default:
          count++;
      }
    }
    return count;
  }

  // Patterns initialization.
  // https://tc39.es/ecma262/#sec-runtime-semantics-bindinginitialization
  function* BindingInitialization(
    node: EstreeLVal,
    value: unknown,
    environment?: EnvironmentRecord
  ): EvaluateResult<unknown, CompletionRecord | undefined> {
    switch (node.type) {
      case "Identifier":
        return InitializeBoundName(node.name, value, environment);
      case "ObjectPattern":
        RequireObjectCoercible(value);
        return yield* PropertyBindingInitialization(
          (node as EstreeObjectPattern).properties,
          value,
          environment
        );
      case "ArrayPattern": {
        const iteratorRecord = CreateListIteratorRecord(
          value as Iterable<unknown>
        );
        return yield* IteratorBindingInitialization(
          node.elements,
          iteratorRecord,
          environment
        );
      }
    }
  }

  // https://tc39.es/ecma262/#sec-destructuring-binding-patterns-runtime-semantics-propertybindinginitialization
  function* PropertyBindingInitialization(
    properties: (EstreeProperty | RestElement)[],
    value: unknown,
    environment?: EnvironmentRecord
  ): CompletionRecordResult {
    const excludedNames = new Set<PropertyKey>();
    for (const prop of properties) {
      if (prop.type === "RestElement") {
        return RestBindingInitialization(
          prop,
          value,
          environment,
          excludedNames
        );
      }
      if (!prop.computed && prop.key.type === "Identifier") {
        yield* KeyedBindingInitialization(
          prop.value as EstreeLVal,
          value,
          environment,
          prop.key.name
        );
        excludedNames.add(prop.key.name);
      } else {
        const P = yield* EvaluateComputedPropertyName(prop.key as Expression);
        yield* KeyedBindingInitialization(
          prop.value as EstreeLVal,
          value,
          environment,
          P
        );
        excludedNames.add(P);
      }
    }
    return NormalCompletion(Empty);
  }

  // https://tc39.es/ecma262/#prod-ComputedPropertyName
  function* EvaluateComputedPropertyName(
    node: Expression
  ): EvaluateResult<unknown, PropertyKey> {
    const propName = GetValue(yield* Evaluate(node));
    return ToPropertyKey(propName);
  }

  // https://tc39.es/ecma262/#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
  function RestBindingInitialization(
    restProperty: RestElement,
    value: unknown,
    environment: EnvironmentRecord | undefined,
    excludedNames: Set<PropertyKey>
  ): CompletionRecord {
    const lhs = ResolveBinding(
      (restProperty.argument as Identifier).name,
      environment
    );
    const restObj = CopyDataProperties({}, value, excludedNames);
    if (!environment) {
      return PutValue(lhs, restObj);
    }
    return InitializeReferencedBinding(lhs, restObj);
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-iteratorbindinginitialization
  function* IteratorBindingInitialization(
    elements: (PatternLike | LVal | null)[],
    iteratorRecord: Iterator<unknown>,
    environment?: EnvironmentRecord
  ): EvaluateResult<unknown, CompletionRecord | undefined> {
    if (elements.length === 0) {
      return NormalCompletion(Empty);
    }
    let result;
    for (const node of elements) {
      if (!node) {
        // Elision element.
        iteratorRecord.next();
        result = NormalCompletion(Empty);
      } else if (node.type === "RestElement") {
        // Rest element.
        if (node.argument.type === "Identifier") {
          const lhs = ResolveBinding(node.argument.name, environment);
          const A: unknown[] = new ArrayConstructor();
          let n = 0;
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = iteratorRecord.next();
            if (done) {
              result = environment
                ? InitializeReferencedBinding(lhs, A)
                : PutValue(lhs, A);
              break;
            }
            A[n] = value;
            n++;
          }
        } else {
          const A: unknown[] = new ArrayConstructor();
          let n = 0;
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = iteratorRecord.next();
            if (done) {
              result = yield* BindingInitialization(
                node.argument,
                A,
                environment
              );
              break;
            }
            A[n] = value;
            n++;
          }
        }
      } else {
        // Normal element.
        const bindingElement =
          node.type === "AssignmentPattern" ? node.left : node;
        switch (bindingElement.type) {
          case "ObjectPattern":
          case "ArrayPattern": {
            let v: unknown;
            const { done, value } = iteratorRecord.next();
            if (!done) {
              v = value;
            }
            if (node.type === "AssignmentPattern" && v === undefined) {
              const defaultValue = yield* Evaluate(node.right);
              v = GetValue(defaultValue);
            }
            result = yield* BindingInitialization(
              bindingElement,
              v,
              environment
            );
            break;
          }
          case "Identifier": {
            const bindingId = bindingElement.name;
            const lhs = ResolveBinding(bindingId, environment);
            let v: unknown;
            const { done, value } = iteratorRecord.next();
            if (!done) {
              v = value;
            }
            if (node.type === "AssignmentPattern" && v === undefined) {
              if (IsAnonymousFunctionDefinition(node.right)) {
                v = NamedEvaluation(node.right, bindingId);
              } else {
                const defaultValue = yield* Evaluate(node.right);
                v = GetValue(defaultValue);
              }
            }
            result = environment
              ? InitializeReferencedBinding(lhs, v)
              : PutValue(lhs, v);
            break;
          }
        }
      }
    }
    return result;
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-keyedbindinginitialization
  function* KeyedBindingInitialization(
    node: EstreeLVal,
    value: unknown,
    environment: EnvironmentRecord | undefined,
    propertyName: PropertyKey
  ): EvaluateResult<unknown, CompletionRecord | undefined> {
    const isIdentifier =
      node.type === "Identifier" ||
      (node.type === "AssignmentPattern" && node.left.type === "Identifier");
    if (isIdentifier) {
      const bindingId =
        node.type === "Identifier" ? node.name : (node.left as Identifier).name;
      const lhs = ResolveBinding(bindingId, environment);
      let v = GetV(value, propertyName);
      if (node.type === "AssignmentPattern" && v === undefined) {
        if (IsAnonymousFunctionDefinition(node.right)) {
          v = NamedEvaluation(node.right, bindingId);
        } else {
          const defaultValue = yield* Evaluate(node.right);
          v = GetValue(defaultValue);
        }
      }
      if (!environment) {
        return PutValue(lhs, v);
      }
      return InitializeReferencedBinding(lhs, v);
    }

    let v = GetV(value, propertyName);
    if (node.type === "AssignmentPattern" && v === undefined) {
      const defaultValue = yield* Evaluate(node.right);
      v = GetValue(defaultValue);
    }
    return yield* BindingInitialization(
      node.type === "AssignmentPattern" ? node.left : node,
      v,
      environment
    );
  }

  // https://tc39.es/ecma262/#sec-initializeboundname
  function InitializeBoundName(
    name: string,
    value: unknown,
    environment?: EnvironmentRecord
  ): CompletionRecord {
    // Assert: environment is always present.
    environment!.InitializeBinding(name, value);
    return NormalCompletion(Empty);
  }

  function ThrowIfFunctionIsInvalid(
    func: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression
  ): void {
    if (func.async || func.generator) {
      throw new SyntaxError(
        `${func.async ? "Async" : "Generator"} function is not allowed`
      );
    }
    if (expressionOnly && !(func as ArrowFunctionExpression).expression) {
      throw new SyntaxError(
        "Only an `Expression` is allowed in `ArrowFunctionExpression`'s body"
      );
    }
  }

  if (expressionOnly) {
    return GetValue(unwind(Evaluate(rootAst)));
  }

  hooks.beforeEvaluate?.(rootAst);
  ThrowIfFunctionIsInvalid(rootAst);
  const [fn] = collectBoundNames(rootAst);
  // Create an immutable binding for the root function.
  rootEnv.CreateImmutableBinding(fn, true);
  const fo = InstantiateFunctionObject(rootAst, rootEnv);
  rootEnv.InitializeBinding(fn, fo);

  if (debug) {
    Object.defineProperties(fo, {
      [DebuggerScope]: {
        value: function () {
          return getRunningContext().LexicalEnvironment;
        },
      },
      [DebuggerNode]: {
        value: function () {
          return currentNode;
        },
      },
    });
  }

  return fo;
}

function unwind(iterator: EvaluateResult<unknown, unknown>): unknown {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = iterator.next();
    if (done) {
      return value;
    }
  }
}
