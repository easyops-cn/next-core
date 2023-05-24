import {
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
} from "./ExecutionContext.js";
import {
  EstreeLVal,
  EstreeNode,
  EstreeObjectExpression,
  EstreeObjectPattern,
  EstreeProperty,
  CookRules,
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
}

export interface CookHooks {
  beforeEvaluate?(node: EstreeNode): void;
  beforeCall?(node: EstreeNode): void;
  beforeBranch?(node: EstreeNode, branch: "if" | "else"): void;
}

export function nativeCook(
  rootAst: Expression,
  codeSource: string,
  attemptToVisitGlobals: string[],
  globalVariables: Record<string, unknown>
) {
  try {
    const fn = new Function(
      attemptToVisitGlobals.join(","),
      `return (${codeSource})`
    );
    return fn(...attemptToVisitGlobals.map((key) => globalVariables[key]));
  } catch (e) /* istanbul ignore next */ {
    if (process.env.NODE_ENV === "test") {
      throw e;
    }
    return cook(rootAst, codeSource, { globalVariables });
  }
}

/** For next-core internal usage only. */
export function cook(
  rootAst: FunctionDeclaration | Expression,
  codeSource: string,
  { rules, globalVariables = {}, hooks = {} }: CookOptions = {}
): unknown {
  const expressionOnly = rootAst.type !== "FunctionDeclaration";

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

  function Evaluate(
    node: EstreeNode,
    optionalChainRef?: OptionalChainRef
  ): CompletionRecord {
    hooks.beforeEvaluate?.(node);
    // Expressions:
    switch (node.type) {
      case "ArrayExpression": {
        // https://tc39.es/ecma262/#sec-array-initializer
        const array = [];
        for (const element of node.elements) {
          if (!element) {
            array.length += 1;
          } else if (element.type === "SpreadElement") {
            const spreadValues = GetValue(
              Evaluate(element.argument)
            ) as unknown[];
            array.push(...spreadValues);
          } else {
            array.push(GetValue(Evaluate(element)));
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
        const leftRef = Evaluate(node.left);
        const leftValue = GetValue(leftRef);
        const rightRef = Evaluate(node.right).Value;
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
        const ref = Evaluate(node.callee, optionalChainRef)
          .Value as ReferenceRecord;
        const func = GetValue(ref) as Function;
        if (
          (func === undefined || func === null) &&
          (node.optional || optionalChainRef?.skipped)
        ) {
          optionalChainRef!.skipped = true;
          return NormalCompletion(undefined);
        }
        sanitize(func);
        return EvaluateCall(func, ref, node.arguments, node.callee);
      }
      case "ChainExpression":
        // https://tc39.es/ecma262/#sec-optional-chains
        return Evaluate(node.expression, {});
      case "ConditionalExpression":
        // https://tc39.es/ecma262/#sec-conditional-operator
        return NormalCompletion(
          GetValue(
            Evaluate(
              GetValue(Evaluate(node.test)) ? node.consequent : node.alternate
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
        const leftValue = GetValue(Evaluate(node.left));
        switch (node.operator) {
          case "&&":
            return NormalCompletion(
              leftValue && GetValue(Evaluate(node.right))
            );
          case "||":
            return NormalCompletion(
              leftValue || GetValue(Evaluate(node.right))
            );
          case "??":
            return NormalCompletion(
              leftValue ?? GetValue(Evaluate(node.right))
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
        const baseReference = Evaluate(node.object, optionalChainRef)
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
        sanitize(baseValue);
        const result = node.computed
          ? EvaluatePropertyAccessWithExpressionKey(
              baseValue,
              node.property as Expression,
              true
            )
          : EvaluatePropertyAccessWithIdentifierKey(
              baseValue,
              node.property as Identifier,
              true
            );
        sanitize(result);
        return NormalCompletion(result);
      }
      case "NewExpression":
        // https://tc39.es/ecma262/#sec-new-operator
        return EvaluateNew(node.callee, node.arguments);
      case "ObjectExpression": {
        // https://tc39.es/ecma262/#sec-object-initializer
        const object: Record<PropertyKey, unknown> = {};
        for (const prop of (node as EstreeObjectExpression).properties) {
          if (prop.type === "SpreadElement") {
            const fromValue = GetValue(Evaluate(prop.argument));
            CopyDataProperties(object, fromValue, new Set());
          } else {
            if (prop.kind !== "init") {
              throw new SyntaxError("Unsupported object getter/setter");
            }
            const propName =
              !prop.computed && prop.key.type === "Identifier"
                ? prop.key.name
                : EvaluateComputedPropertyName(prop.key as Expression);
            if (propName === "__proto__") {
              throw new TypeError(
                "Setting '__proto__' property is not allowed"
              );
            }
            object[propName] = GetValue(Evaluate(prop.value));
          }
        }
        return NormalCompletion(object);
      }
      case "SequenceExpression": {
        // https://tc39.es/ecma262/#sec-comma-operator
        let result: CompletionRecord | undefined;
        for (const expr of node.expressions) {
          result = NormalCompletion(GetValue(Evaluate(expr)));
        }
        return result!;
      }
      case "TemplateLiteral": {
        // https://tc39.es/ecma262/#sec-template-literals
        const chunks: string[] = [node.quasis[0].value.cooked!];
        let index = 0;
        for (const expr of node.expressions) {
          const val = GetValue(Evaluate(expr));
          chunks.push(String(val));
          chunks.push(node.quasis[(index += 1)].value.cooked!);
        }
        return NormalCompletion(chunks.join(""));
      }
      case "TaggedTemplateExpression": {
        // https://tc39.es/ecma262/#sec-tagged-templates
        const tagRef = Evaluate(node.tag).Value as ReferenceRecord;
        const tagFunc = GetValue(tagRef) as Function;
        sanitize(tagFunc);
        return EvaluateCall(tagFunc, tagRef, node.quasi, node.tag);
      }
      case "UnaryExpression": {
        // https://tc39.es/ecma262/#sec-unary-operators
        const ref = Evaluate(node.argument).Value as ReferenceRecord;
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
              const lref = Evaluate(node.left).Value as ReferenceRecord;
              // Todo: IsAnonymousFunctionDefinition(lref)
              const rref = Evaluate(node.right);
              const rval = GetValue(rref);

              PutValue(lref, rval);
              return NormalCompletion(rval);
            }
            const rref = Evaluate(node.right);
            const rval = GetValue(rref) as string | number;
            DestructuringAssignmentEvaluation(node.left, rval);
            return NormalCompletion(rval);
          }
          // Operators other than `=`.
          const lref = Evaluate(node.left).Value as ReferenceRecord;
          const lval = GetValue(lref) as string | number;
          const rref = Evaluate(node.right);
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
          const blockValue = EvaluateStatementList(node.body);
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
          return EvaluateBreakableStatement(DoWhileLoopEvaluation(node));
        case "ExpressionStatement":
        case "TSAsExpression":
          // https://tc39.es/ecma262/#sec-expression-statement
          return Evaluate(node.expression);
        case "ForInStatement":
        case "ForOfStatement":
          // https://tc39.es/ecma262/#sec-for-in-and-for-of-statements
          return EvaluateBreakableStatement(ForInOfLoopEvaluation(node));
        case "ForStatement":
          // https://tc39.es/ecma262/#sec-for-statement
          return EvaluateBreakableStatement(ForLoopEvaluation(node));
        case "FunctionDeclaration":
          // https://tc39.es/ecma262/#sec-function-definitions
          return NormalCompletion(Empty);
        case "FunctionExpression":
          // https://tc39.es/ecma262/#sec-function-defining-expressions
          ThrowIfFunctionIsInvalid(node);
          return NormalCompletion(InstantiateOrdinaryFunctionExpression(node));
        case "IfStatement":
          // https://tc39.es/ecma262/#sec-if-statement
          return GetValue(Evaluate(node.test))
            ? (hooks.beforeBranch?.(node, "if"),
              UpdateEmpty(Evaluate(node.consequent), undefined))
            : (hooks.beforeBranch?.(node, "else"), node.alternate)
            ? UpdateEmpty(Evaluate(node.alternate), undefined)
            : NormalCompletion(undefined);
        case "ReturnStatement": {
          // https://tc39.es/ecma262/#sec-return-statement
          let v: unknown;
          if (node.argument) {
            const exprRef = Evaluate(node.argument);
            v = GetValue(exprRef);
          }
          return new CompletionRecord("return", v);
        }
        case "ThrowStatement":
          // https://tc39.es/ecma262/#sec-throw-statement
          throw GetValue(Evaluate(node.argument));
        case "UpdateExpression": {
          // https://tc39.es/ecma262/#sec-update-expressions
          const lhs = Evaluate(node.argument).Value as ReferenceRecord;
          const oldValue = Number(GetValue(lhs));
          const newValue = node.operator === "++" ? oldValue + 1 : oldValue - 1;
          PutValue(lhs, newValue);
          return NormalCompletion(node.prefix ? newValue : oldValue);
        }
        case "SwitchCase":
          return EvaluateStatementList(node.consequent);
        case "SwitchStatement": {
          // https://tc39.es/ecma262/#sec-switch-statement
          const exprRef = Evaluate(node.discriminant);
          const switchValue = GetValue(exprRef);
          const oldEnv = getRunningContext().LexicalEnvironment;
          const blockEnv = new DeclarativeEnvironment(oldEnv);
          BlockDeclarationInstantiation(node.cases, blockEnv);
          getRunningContext().LexicalEnvironment = blockEnv;
          const R = CaseBlockEvaluation(node.cases, switchValue);
          getRunningContext().LexicalEnvironment = oldEnv;
          return EvaluateBreakableStatement(R);
        }
        case "TryStatement": {
          // https://tc39.es/ecma262/#sec-try-statement
          let R: CompletionRecord;
          try {
            R = Evaluate(node.block);
          } catch (error) {
            if (node.handler) {
              hooks.beforeEvaluate?.(node.handler);
              R = CatchClauseEvaluation(node.handler, error);
            } else {
              throw error;
            }
          } finally {
            if (node.finalizer) {
              const F = Evaluate(node.finalizer);
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
            if (!declarator.init) {
              // Assert: a declarator without init is always an identifier.
              if (node.kind === "var") {
                result = NormalCompletion(Empty);
              } else {
                const lhs = ResolveBinding((declarator.id as Identifier).name);
                result = InitializeReferencedBinding(lhs, undefined);
              }
            } else if (declarator.id.type === "Identifier") {
              const bindingId = declarator.id.name;
              const lhs = ResolveBinding(bindingId);
              // Todo: IsAnonymousFunctionDefinition(Initializer)
              const rhs = Evaluate(declarator.init);
              const value = GetValue(rhs);
              result =
                node.kind === "var"
                  ? PutValue(lhs, value)
                  : InitializeReferencedBinding(lhs, value);
            } else {
              const rhs = Evaluate(declarator.init);
              const rval = GetValue(rhs);
              result = BindingInitialization(
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
          return EvaluateBreakableStatement(WhileLoopEvaluation(node));
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
  function CatchClauseEvaluation(
    node: CatchClause,
    thrownValue: unknown
  ): CompletionRecord {
    if (!node.param) {
      return Evaluate(node.body);
    }
    const oldEnv = getRunningContext().LexicalEnvironment;
    const catchEnv = new DeclarativeEnvironment(oldEnv);
    for (const argName of collectBoundNames(node.param)) {
      catchEnv.CreateMutableBinding(argName, false);
    }
    getRunningContext().LexicalEnvironment = catchEnv;
    BindingInitialization(node.param, thrownValue, catchEnv);
    const B = Evaluate(node.body);
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
  function CaseBlockEvaluation(
    cases: SwitchCase[],
    input: unknown
  ): CompletionRecord {
    let V: unknown;

    const defaultCaseIndex = cases.findIndex((switchCase) => !switchCase.test);
    const hasDefaultCase = defaultCaseIndex >= 0;
    const A = hasDefaultCase ? cases.slice(0, defaultCaseIndex) : cases;
    let found = false;
    for (const C of A) {
      if (!found) {
        found = CaseClauseIsSelected(C, input);
      }
      if (found) {
        const R = Evaluate(C);
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
          foundInB = CaseClauseIsSelected(C, input);
        }
        if (foundInB) {
          const R = Evaluate(C);
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
    const R = Evaluate(cases[defaultCaseIndex]);
    if (R.Value !== Empty) {
      V = R.Value;
    }
    if (R.Type !== "normal") {
      return UpdateEmpty(R, V);
    }

    // NOTE: The following is another complete iteration of the second CaseClauses.
    for (const C of B) {
      const R = Evaluate(C);
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
  function CaseClauseIsSelected(C: SwitchCase, input: unknown): boolean {
    const clauseSelector = GetValue(Evaluate(C.test!));
    return input === clauseSelector;
  }

  // While statements.
  // https://tc39.es/ecma262/#sec-runtime-semantics-whileloopevaluation
  function WhileLoopEvaluation(node: WhileStatement): CompletionRecord {
    let V: unknown;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exprValue = GetValue(Evaluate(node.test));
      if (!exprValue) {
        return NormalCompletion(V);
      }
      const stmtResult = Evaluate(node.body);
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
  function DoWhileLoopEvaluation(node: DoWhileStatement): CompletionRecord {
    let V: unknown;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const stmtResult = Evaluate(node.body);
      if (!LoopContinues(stmtResult)) {
        return UpdateEmpty(stmtResult, V);
      }
      if (stmtResult.Value !== Empty) {
        V = stmtResult.Value;
      }
      const exprValue = GetValue(Evaluate(node.test));
      if (!exprValue) {
        return NormalCompletion(V);
      }
    }
  }

  // For in/of statements.
  // https://tc39.es/ecma262/#sec-runtime-semantics-forinofloopevaluation
  function ForInOfLoopEvaluation(
    node: ForInStatement | ForOfStatement
  ): CompletionRecord {
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
    const keyResult = ForInOfHeadEvaluation(
      uninitializedBoundNames,
      node.right,
      iterationKind
    );
    if (keyResult.Type !== "normal") {
      // When enumerate, if the target is nil, a break completion will be returned.
      return keyResult;
    }
    return ForInOfBodyEvaluation(
      lhs,
      node.body,
      keyResult.Value as Iterator<unknown>,
      iterationKind,
      lhsKind
    );
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-forinofheadevaluation
  function ForInOfHeadEvaluation(
    uninitializedBoundNames: string[],
    expr: Expression,
    iterationKind: "enumerate" | "iterate"
  ): CompletionRecord {
    const runningContext = getRunningContext();
    const oldEnv = runningContext.LexicalEnvironment;
    if (uninitializedBoundNames.length > 0) {
      const newEnv = new DeclarativeEnvironment(oldEnv);
      for (const name of uninitializedBoundNames) {
        newEnv.CreateMutableBinding(name, false);
      }
      runningContext.LexicalEnvironment = newEnv;
    }
    const exprRef = Evaluate(expr);
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

  function ForInOfBodyEvaluation(
    node: VariableDeclaration | EstreeLVal,
    stmt: Statement,
    iteratorRecord: Iterator<unknown>,
    iterationKind: "enumerate" | "iterate",
    lhsKind: "varBinding" | "lexicalBinding" | "assignment"
  ): CompletionRecord {
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
      const { done, value: nextValue } = iteratorRecord.next();
      if (done) {
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
        if (!destructuring) {
          const [lhsName] = collectBoundNames(lhs);
          lhsRef = ResolveBinding(lhsName);
        }
      } else if (!destructuring) {
        lhsRef = Evaluate(lhs).Value as ReferenceRecord;
      }
      destructuring
        ? lhsKind === "assignment"
          ? DestructuringAssignmentEvaluation(lhs, nextValue)
          : lhsKind === "varBinding"
          ? BindingInitialization(lhs, nextValue, undefined)
          : BindingInitialization(lhs, nextValue, iterationEnv)
        : lhsKind === "lexicalBinding"
        ? InitializeReferencedBinding(lhsRef!, nextValue)
        : PutValue(lhsRef!, nextValue);

      const result = Evaluate(stmt);
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
  function ForLoopEvaluation(node: ForStatement): CompletionRecord {
    if (node.init?.type === "VariableDeclaration") {
      // `for (var … ; … ; … ) …`
      if (node.init.kind === "var") {
        Evaluate(node.init);
        return ForBodyEvaluation(node.test, node.update, node.body, []);
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
      Evaluate(node.init);
      const perIterationLets = isConst ? [] : Array.from(boundNames);
      const bodyResult = ForBodyEvaluation(
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
      const exprRef = Evaluate(node.init);
      GetValue(exprRef);
    }
    return ForBodyEvaluation(node.test, node.update, node.body, []);
  }

  // https://tc39.es/ecma262/#sec-forbodyevaluation
  function ForBodyEvaluation(
    test: Expression | null | undefined,
    increment: Expression | null | undefined,
    stmt: Statement,
    perIterationBindings: string[]
  ): CompletionRecord {
    CreatePerIterationEnvironment(perIterationBindings);
    let V: unknown;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (test) {
        const testRef = Evaluate(test);
        const testValue = GetValue(testRef);
        if (!testValue) {
          return NormalCompletion(V);
        }
      }
      const result = Evaluate(stmt) as CompletionRecord;
      if (!LoopContinues(result)) {
        return UpdateEmpty(result, V);
      }
      if (result.Value) {
        V = result.Value;
      }
      CreatePerIterationEnvironment(perIterationBindings);
      if (increment) {
        const incRef = Evaluate(increment);
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
  function DestructuringAssignmentEvaluation(
    pattern: ObjectPattern | EstreeObjectPattern | ArrayPattern,
    value: unknown
  ): CompletionRecord {
    if (pattern.type === "ObjectPattern") {
      RequireObjectCoercible(value);
      if (pattern.properties.length > 0) {
        PropertyDestructuringAssignmentEvaluation(
          (pattern as EstreeObjectPattern).properties,
          value
        );
      }
      return NormalCompletion(Empty);
    }
    const iteratorRecord = CreateListIteratorRecord(value as Iterable<unknown>);
    return IteratorDestructuringAssignmentEvaluation(
      pattern.elements,
      iteratorRecord
    );
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-propertydestructuringassignmentevaluation
  function PropertyDestructuringAssignmentEvaluation(
    properties: (EstreeProperty | RestElement)[],
    value: unknown
  ): void {
    const excludedNames = new Set<PropertyKey>();
    for (const prop of properties) {
      if (prop.type === "Property") {
        const propName =
          !prop.computed && prop.key.type === "Identifier"
            ? prop.key.name
            : (EvaluateComputedPropertyName(prop.key as Expression) as string);
        const valueTarget =
          prop.value.type === "AssignmentPattern"
            ? prop.value.left
            : prop.value;
        if (valueTarget.type === "Identifier") {
          const lref = ResolveBinding(valueTarget.name);
          let v = GetV(value, propName);
          if (prop.value.type === "AssignmentPattern" && v === undefined) {
            // Todo(steve): check IsAnonymousFunctionDefinition(Initializer)
            const defaultValue = Evaluate(prop.value.right);
            v = GetValue(defaultValue);
          }
          PutValue(lref, v);
          excludedNames.add(propName);
        } else {
          KeyedDestructuringAssignmentEvaluation(prop.value, value, propName);
          excludedNames.add(propName);
        }
      } else {
        RestDestructuringAssignmentEvaluation(prop, value, excludedNames);
      }
    }
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-keyeddestructuringassignmentevaluation
  function KeyedDestructuringAssignmentEvaluation(
    node: EstreeNode,
    value: unknown,
    propertyName: PropertyKey
  ): CompletionRecord {
    const assignmentTarget =
      node.type === "AssignmentPattern" ? node.left : node;
    const isObjectOrArray =
      assignmentTarget.type === "ArrayPattern" ||
      assignmentTarget.type === "ObjectPattern";
    let lref: ReferenceRecord | undefined;
    if (!isObjectOrArray) {
      lref = Evaluate(assignmentTarget).Value as ReferenceRecord;
    }
    const v = GetV(value, propertyName);
    let rhsValue;
    if (node.type === "AssignmentPattern" && v === undefined) {
      // Todo(steve): check IsAnonymousFunctionDefinition(Initializer)
      const defaultValue = Evaluate(node.right);
      rhsValue = GetValue(defaultValue);
    } else {
      rhsValue = v;
    }
    if (isObjectOrArray) {
      return DestructuringAssignmentEvaluation(assignmentTarget, rhsValue);
    }
    return PutValue(lref!, rhsValue);
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-restdestructuringassignmentevaluation
  function RestDestructuringAssignmentEvaluation(
    restProperty: RestElement,
    value: unknown,
    excludedNames: Set<PropertyKey>
  ): CompletionRecord {
    const lref = Evaluate(restProperty.argument).Value as ReferenceRecord;
    const restObj = CopyDataProperties({}, value, excludedNames);
    return PutValue(lref, restObj);
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-iteratordestructuringassignmentevaluation
  function IteratorDestructuringAssignmentEvaluation(
    elements: (PatternLike | LVal | null)[],
    iteratorRecord: Iterator<unknown>
  ): CompletionRecord {
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
        lref = Evaluate(assignmentTarget).Value as ReferenceRecord;
      }
      let v: unknown;
      if (element.type !== "RestElement") {
        const { done, value: nextValue } = iteratorRecord.next();
        const value = done ? undefined : nextValue;
        if (element.type === "AssignmentPattern" && value === undefined) {
          // Todo(steve): check IsAnonymousFunctionDefinition(Initializer)
          const defaultValue = Evaluate(element.right);
          v = GetValue(defaultValue);
        } else {
          v = value;
        }
      } else {
        // RestElement
        v = [];
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
        status = DestructuringAssignmentEvaluation(assignmentTarget, v);
      } else {
        status = PutValue(lref!, v);
      }
    }
    return status;
  }

  // Object expressions.
  // https://tc39.es/ecma262/#sec-evaluate-property-access-with-expression-key
  function EvaluatePropertyAccessWithExpressionKey(
    baseValue: Record<PropertyKey, unknown>,
    expression: Expression,
    strict: boolean
  ): ReferenceRecord {
    const propertyNameReference = Evaluate(expression);
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
  function EvaluateCall(
    func: Function,
    ref: ReferenceRecord,
    args: CallExpression["arguments"] | TemplateLiteral,
    callee: CallExpression["callee"]
  ): CompletionRecord {
    let thisValue;
    if (ref instanceof ReferenceRecord) {
      if (IsPropertyReference(ref)) {
        thisValue = ref.Base;
      }
    }
    const argList = ArgumentListEvaluation(args);
    if (typeof func !== "function") {
      const funcName = codeSource.substring(callee.start!, callee.end!);
      throw new TypeError(`${funcName} is not a function`);
    }
    const result = func.apply(thisValue, argList);
    sanitize(result);
    return NormalCompletion(result);
  }

  // https://tc39.es/ecma262/#sec-evaluatenew
  function EvaluateNew(
    constructExpr: CallExpression["callee"],
    args: NewExpression["arguments"]
  ): CompletionRecord {
    const ref = Evaluate(constructExpr);
    const constructor = GetValue(ref) as new (...args: unknown[]) => unknown;
    const argList = ArgumentListEvaluation(args);
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
    if (!isAllowedConstructor(constructor)) {
      const constructorName = codeSource.substring(
        constructExpr.start!,
        constructExpr.end!
      );
      throw new TypeError(`${constructorName} is not an allowed constructor`);
    }
    return NormalCompletion(new constructor(...argList));
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-argumentlistevaluation
  function ArgumentListEvaluation(
    args: CallExpression["arguments"] | TemplateLiteral
  ): unknown[] {
    const array: unknown[] = [];
    if (Array.isArray(args)) {
      for (const arg of args) {
        if (arg.type === "SpreadElement") {
          const spreadValues = GetValue(Evaluate(arg.argument)) as unknown[];
          array.push(...spreadValues);
        } else {
          array.push(GetValue(Evaluate(arg)));
        }
      }
    } else {
      array.push(GetTemplateObject(args));
      for (const expr of args.expressions) {
        array.push(GetValue(Evaluate(expr)));
      }
    }
    return array;
  }

  // https://tc39.es/ecma262/#sec-ecmascript-function-objects-call-thisargument-argumentslist
  function CallFunction(
    closure: FunctionObject,
    args: Iterable<unknown>
  ): unknown {
    hooks.beforeCall?.(closure[SourceNode]);
    PrepareForOrdinaryCall(closure);
    const result = OrdinaryCallEvaluateBody(closure, args);
    executionContextStack.pop();
    if (result.Type === "return") {
      return result.Value;
    }
    return undefined;
  }

  // https://tc39.es/ecma262/#sec-prepareforordinarycall
  function PrepareForOrdinaryCall(F: FunctionObject): ExecutionContext {
    const calleeContext = new ExecutionContext();
    calleeContext.Function = F;
    const localEnv = new FunctionEnvironment(F[Environment]);
    calleeContext.VariableEnvironment = localEnv;
    calleeContext.LexicalEnvironment = localEnv;
    executionContextStack.push(calleeContext);
    return calleeContext;
  }

  // https://tc39.es/ecma262/#sec-ordinarycallevaluatebody
  function OrdinaryCallEvaluateBody(
    F: FunctionObject,
    args: Iterable<unknown>
  ): CompletionRecord {
    return EvaluateFunctionBody(F[ECMAScriptCode], F, args);
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-evaluatefunctionbody
  function EvaluateFunctionBody(
    body: Statement[] | Expression,
    F: FunctionObject,
    args: Iterable<unknown>
  ): CompletionRecord {
    FunctionDeclarationInstantiation(F, args);
    if (Array.isArray(body)) {
      return EvaluateStatementList(body);
    }
    return new CompletionRecord("return", GetValue(Evaluate(body)));
  }

  // https://tc39.es/ecma262/#sec-block-runtime-semantics-evaluation
  function EvaluateStatementList(statements: Statement[]): CompletionRecord {
    let result = NormalCompletion(Empty);
    for (const stmt of statements) {
      const s = Evaluate(stmt);
      if (s.Type !== "normal") {
        return s;
      }
      result = UpdateEmpty(result, s.Value);
    }
    return result;
  }

  // https://tc39.es/ecma262/#sec-functiondeclarationinstantiation
  function FunctionDeclarationInstantiation(
    func: FunctionObject,
    args: Iterable<unknown>
  ): void {
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

    const env = calleeContext.LexicalEnvironment!;
    for (const paramName of parameterNames) {
      // In strict mode, it's guaranteed no duplicate params exist.
      env.CreateMutableBinding(paramName, false);
    }

    const iteratorRecord = CreateListIteratorRecord(args);
    IteratorBindingInitialization(formals, iteratorRecord, env);

    let varEnv: EnvironmentRecord;
    if (!hasParameterExpressions) {
      // NOTE: Only a single Environment Record is needed for the parameters
      // and top-level vars.
      // `varNames` are unique.
      for (const n of varNames) {
        if (!parameterNames.includes(n)) {
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
      for (const n of varNames) {
        varEnv.CreateMutableBinding(n, false);
        let initialValue: unknown;
        if (parameterNames.includes(n) && !functionNames.includes(n)) {
          initialValue = env.GetBindingValue(n, false);
        }
        varEnv.InitializeBinding(n, initialValue);
        // NOTE: A var with the same name as a formal parameter initially has
        // the same value as the corresponding initialized parameter.
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

  // https://tc39.es/ecma262/#sec-runtime-semantics-instantiatefunctionobject
  function InstantiateFunctionObject(
    func: FunctionDeclaration,
    scope: EnvironmentRecord
  ): FunctionObject {
    return OrdinaryFunctionCreate(func, scope, true);
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-instantiateordinaryfunctionexpression
  function InstantiateOrdinaryFunctionExpression(
    functionExpression: FunctionExpression
  ): FunctionObject {
    const scope = getRunningContext().LexicalEnvironment!;
    if (functionExpression.id) {
      const name = functionExpression.id.name;
      const funcEnv = new DeclarativeEnvironment(scope);
      funcEnv.CreateImmutableBinding(name, false);
      const closure = OrdinaryFunctionCreate(functionExpression, funcEnv, true);
      funcEnv.InitializeBinding(name, closure);
      return closure;
    } else {
      const closure = OrdinaryFunctionCreate(functionExpression, scope, true);
      return closure;
    }
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-instantiatearrowfunctionexpression
  function InstantiateArrowFunctionExpression(
    arrowFunction: ArrowFunctionExpression
  ): FunctionObject {
    const scope = getRunningContext().LexicalEnvironment!;
    const closure = OrdinaryFunctionCreate(arrowFunction, scope, false);
    return closure;
  }

  // https://tc39.es/ecma262/#sec-ordinaryfunctioncreate
  function OrdinaryFunctionCreate(
    sourceNode:
      | FunctionDeclaration
      | FunctionExpression
      | ArrowFunctionExpression,
    scope: EnvironmentRecord,
    isConstructor: boolean
  ): FunctionObject {
    const F = function () {
      // eslint-disable-next-line prefer-rest-params
      return CallFunction(F, arguments);
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
    });
    return F;
  }

  // Patterns initialization.
  // https://tc39.es/ecma262/#sec-runtime-semantics-bindinginitialization
  function BindingInitialization(
    node: EstreeLVal,
    value: unknown,
    environment?: EnvironmentRecord
  ): CompletionRecord | undefined {
    switch (node.type) {
      case "Identifier":
        return InitializeBoundName(node.name, value, environment);
      case "ObjectPattern":
        RequireObjectCoercible(value);
        return PropertyBindingInitialization(
          (node as EstreeObjectPattern).properties,
          value,
          environment
        );
      case "ArrayPattern": {
        const iteratorRecord = CreateListIteratorRecord(
          value as Iterable<unknown>
        );
        return IteratorBindingInitialization(
          node.elements,
          iteratorRecord,
          environment
        );
      }
    }
  }

  // https://tc39.es/ecma262/#sec-destructuring-binding-patterns-runtime-semantics-propertybindinginitialization
  function PropertyBindingInitialization(
    properties: (EstreeProperty | RestElement)[],
    value: unknown,
    environment?: EnvironmentRecord
  ): CompletionRecord {
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
        KeyedBindingInitialization(
          prop.value as EstreeLVal,
          value,
          environment,
          prop.key.name
        );
        excludedNames.add(prop.key.name);
      } else {
        const P = EvaluateComputedPropertyName(prop.key as Expression);
        KeyedBindingInitialization(
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
  function EvaluateComputedPropertyName(node: Expression): PropertyKey {
    const propName = GetValue(Evaluate(node));
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
  function IteratorBindingInitialization(
    elements: (PatternLike | LVal | null)[],
    iteratorRecord: Iterator<unknown>,
    environment?: EnvironmentRecord
  ): CompletionRecord | undefined {
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
          const A: unknown[] = [];
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
          const A: unknown[] = [];
          let n = 0;
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = iteratorRecord.next();
            if (done) {
              result = BindingInitialization(node.argument, A, environment);
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
              const defaultValue = Evaluate(node.right);
              v = GetValue(defaultValue);
            }
            result = BindingInitialization(bindingElement, v, environment);
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
              // IsAnonymousFunctionDefinition(Initializer)
              const defaultValue = Evaluate(node.right);
              v = GetValue(defaultValue);
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
  function KeyedBindingInitialization(
    node: EstreeLVal,
    value: unknown,
    environment: EnvironmentRecord | undefined,
    propertyName: PropertyKey
  ): CompletionRecord | undefined {
    const isIdentifier =
      node.type === "Identifier" ||
      (node.type === "AssignmentPattern" && node.left.type === "Identifier");
    if (isIdentifier) {
      const bindingId =
        node.type === "Identifier" ? node.name : (node.left as Identifier).name;
      const lhs = ResolveBinding(bindingId, environment);
      let v = GetV(value, propertyName);
      if (node.type === "AssignmentPattern" && v === undefined) {
        // If IsAnonymousFunctionDefinition(Initializer)
        const defaultValue = Evaluate(node.right);
        v = GetValue(defaultValue);
      }
      if (!environment) {
        return PutValue(lhs, v);
      }
      return InitializeReferencedBinding(lhs, v);
    }

    let v = GetV(value, propertyName);
    if (node.type === "AssignmentPattern" && v === undefined) {
      const defaultValue = Evaluate(node.right);
      v = GetValue(defaultValue);
    }
    return BindingInitialization(
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
    return GetValue(Evaluate(rootAst));
  }

  hooks.beforeEvaluate?.(rootAst);
  ThrowIfFunctionIsInvalid(rootAst);
  const [fn] = collectBoundNames(rootAst);
  // Create an immutable binding for the root function.
  rootEnv.CreateImmutableBinding(fn, true);
  const fo = InstantiateFunctionObject(rootAst, rootEnv);
  rootEnv.InitializeBinding(fn, fo);
  return fo;
}
