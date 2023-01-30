import {
  ArrowFunctionExpression,
  Expression,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  Statement,
  SwitchCase,
  VariableDeclaration,
} from "@babel/types";
import { hasOwnProperty } from "./hasOwnProperty.js";
import {
  AnalysisContext,
  AnalysisEnvironment,
  AnalysisFunctionObject,
} from "./AnalysisContext.js";
import {
  EstreeNode,
  EstreeVisitors,
  NodeWithBoundNames,
} from "./interfaces.js";
import {
  collectBoundNames,
  collectScopedDeclarations,
  containsExpression,
} from "./traverse.js";

export interface PrecookOptions {
  expressionOnly?: boolean;
  /** @deprecated Use hooks instead. */
  visitors?: EstreeVisitors;
  hooks?: PrecookHooks;
  withParent?: boolean;
}

export type EstreeParent = EstreeParentItem[];

export interface EstreeParentItem {
  node: EstreeNode;
  key: string;
  index?: number;
}

export interface PrecookHooks {
  beforeVisit?(node: EstreeNode, parent?: EstreeParent): void;
  beforeVisitGlobal?(node: Identifier, parent?: EstreeParent): void;
  /** Return true if want to silent warnings for unknown nodes. */
  beforeVisitUnknown?(node: EstreeNode, parent?: EstreeParent): boolean | void;
}

/**
 * Analysis an AST of a storyboard function or an evaluation expression.
 *
 * @param rootAst - The root AST.
 * @param options - Analysis options.
 * @returns A set of global variables the root AST attempts to access.
 */
export function precook(
  rootAst: Expression | FunctionDeclaration,
  { expressionOnly, visitors, withParent, hooks = {} }: PrecookOptions = {}
): Set<string> {
  const attemptToVisitGlobals = new Set<string>();
  const analysisContextStack: AnalysisContext[] = [];
  const rootEnv = new AnalysisEnvironment(null);
  const rootContext = new AnalysisContext();
  rootContext.VariableEnvironment = rootEnv;
  rootContext.LexicalEnvironment = rootEnv;
  analysisContextStack.push(rootContext);

  function getRunningContext(): AnalysisContext {
    return analysisContextStack[analysisContextStack.length - 1];
  }

  function visit(node: EstreeNode): void {
    if (visitors && hasOwnProperty(visitors, node.type)) {
      visitors[node.type](node);
    }
  }

  function EvaluateChildren<T extends EstreeNode>(
    node: T,
    keys: (keyof T)[],
    parent?: EstreeParent
  ): void {
    for (const key of keys) {
      Evaluate(
        node[key] as unknown as EstreeNode | EstreeNode[],
        parent?.concat({ node, key } as EstreeParentItem)
      );
    }
  }

  function Evaluate(
    node: EstreeNode | EstreeNode[],
    parent?: EstreeParent
  ): void {
    if (Array.isArray(node)) {
      node.forEach((n, index) => {
        Evaluate(
          n,
          parent
            ? parent.slice(0, -1).concat({
                ...parent[parent.length - 1],
                index,
              })
            : parent
        );
      });
    } else if (node) {
      // `node` maybe `null` in some cases.
      hooks.beforeVisit?.(node, parent);
      visit(node);
      // Expressions:
      switch (node.type) {
        case "Identifier":
          if (!ResolveBinding(node.name)) {
            hooks.beforeVisitGlobal?.(node, parent);
            attemptToVisitGlobals.add(node.name);
          }
          return;
        case "ArrayExpression":
        case "ArrayPattern":
          EvaluateChildren(node, ["elements"], parent);
          return;
        case "ArrowFunctionExpression": {
          const env = getRunningContext().LexicalEnvironment;
          const closure = OrdinaryFunctionCreate(node, env);
          CallFunction(closure, parent);
          return;
        }
        case "AssignmentPattern":
        case "BinaryExpression":
        case "LogicalExpression":
          EvaluateChildren(node, ["left", "right"], parent);
          return;
        case "CallExpression":
        case "NewExpression":
          EvaluateChildren(node, ["callee", "arguments"], parent);
          return;
        case "ChainExpression":
          EvaluateChildren(node, ["expression"], parent);
          return;
        case "ConditionalExpression":
          EvaluateChildren(node, ["test", "consequent", "alternate"], parent);
          return;
        case "MemberExpression":
          EvaluateChildren(node, ["object"], parent);
          if (node.computed) {
            EvaluateChildren(node, ["property"], parent);
          }
          return;
        case "ObjectExpression":
        case "ObjectPattern":
          EvaluateChildren(node, ["properties"], parent);
          return;
        case "Property":
          if (node.computed) {
            EvaluateChildren(node, ["key"], parent);
          }
          EvaluateChildren(node, ["value"], parent);
          return;
        case "RestElement":
        case "SpreadElement":
        case "UnaryExpression":
          EvaluateChildren(node, ["argument"], parent);
          return;
        case "SequenceExpression":
        case "TemplateLiteral":
          EvaluateChildren(node, ["expressions"], parent);
          return;
        case "TaggedTemplateExpression":
          EvaluateChildren(node, ["tag", "quasi"], parent);
          return;
        case "Literal":
          return;
      }
      if (!expressionOnly) {
        // Statements and assignments:
        switch (node.type) {
          case "AssignmentExpression":
            EvaluateChildren(node, ["right", "left"], parent);
            return;
          case "BlockStatement": {
            if (!node.body.length) {
              return;
            }
            const runningContext = getRunningContext();
            const oldEnv = runningContext.LexicalEnvironment;
            const blockEnv = new AnalysisEnvironment(oldEnv);
            BlockDeclarationInstantiation(node.body, blockEnv);
            runningContext.LexicalEnvironment = blockEnv;
            EvaluateChildren(node, ["body"], parent);
            runningContext.LexicalEnvironment = oldEnv;
            return;
          }
          case "BreakStatement":
          case "ContinueStatement":
          case "EmptyStatement":
            return;
          case "CatchClause": {
            const runningContext = getRunningContext();
            const oldEnv = runningContext.LexicalEnvironment;
            const catchEnv = new AnalysisEnvironment(oldEnv);
            BoundNamesInstantiation(node.param, catchEnv);
            runningContext.LexicalEnvironment = catchEnv;
            EvaluateChildren(node, ["param", "body"], parent);
            runningContext.LexicalEnvironment = oldEnv;
            return;
          }
          case "DoWhileStatement":
            EvaluateChildren(node, ["body", "test"], parent);
            return;
          case "ExpressionStatement":
          case "TSAsExpression":
            EvaluateChildren(node, ["expression"], parent);
            return;
          case "ForInStatement":
          case "ForOfStatement": {
            // ForIn/OfHeadEvaluation
            const lexicalBinding =
              node.left.type === "VariableDeclaration" &&
              node.left.kind !== "var";
            const runningContext = getRunningContext();
            const oldEnv = runningContext.LexicalEnvironment;
            if (lexicalBinding) {
              const newEnv = new AnalysisEnvironment(oldEnv);
              BoundNamesInstantiation(node.left, newEnv);
              runningContext.LexicalEnvironment = newEnv;
            }
            EvaluateChildren(node, ["right"], parent);
            runningContext.LexicalEnvironment = oldEnv;

            // ForIn/OfBodyEvaluation
            if (lexicalBinding) {
              const iterationEnv = new AnalysisEnvironment(oldEnv);
              BoundNamesInstantiation(node.left, iterationEnv);
              runningContext.LexicalEnvironment = iterationEnv;
            }
            EvaluateChildren(node, ["left", "body"], parent);
            runningContext.LexicalEnvironment = oldEnv;
            return;
          }
          case "ForStatement": {
            const lexicalBinding =
              node.init?.type === "VariableDeclaration" &&
              node.init.kind !== "var";
            const runningContext = getRunningContext();
            const oldEnv = runningContext.LexicalEnvironment;
            if (lexicalBinding) {
              const loopEnv = new AnalysisEnvironment(oldEnv);
              BoundNamesInstantiation(
                node.init as VariableDeclaration,
                loopEnv
              );
              runningContext.LexicalEnvironment = loopEnv;
            }
            EvaluateChildren(node, ["init", "test", "body", "update"], parent);
            runningContext.LexicalEnvironment = oldEnv;
            return;
          }
          case "FunctionDeclaration": {
            const [fn] = collectBoundNames(node);
            const env = getRunningContext().LexicalEnvironment!;
            const fo = OrdinaryFunctionCreate(node, env);
            env.CreateBinding(fn);
            CallFunction(fo, parent);
            return;
          }
          case "FunctionExpression": {
            const closure = InstantiateOrdinaryFunctionExpression(node);
            CallFunction(closure, parent);
            return;
          }
          case "IfStatement":
            EvaluateChildren(node, ["test", "consequent", "alternate"], parent);
            return;
          case "ReturnStatement":
          case "ThrowStatement":
          case "UpdateExpression":
            EvaluateChildren(node, ["argument"], parent);
            return;
          case "SwitchCase":
            EvaluateChildren(node, ["test", "consequent"], parent);
            return;
          case "SwitchStatement": {
            EvaluateChildren(node, ["discriminant"], parent);
            const runningContext = getRunningContext();
            const oldEnv = runningContext.LexicalEnvironment;
            const blockEnv = new AnalysisEnvironment(oldEnv);
            BlockDeclarationInstantiation(node.cases, blockEnv);
            runningContext.LexicalEnvironment = blockEnv;
            EvaluateChildren(node, ["cases"], parent);
            runningContext.LexicalEnvironment = oldEnv;
            return;
          }
          case "TryStatement":
            EvaluateChildren(node, ["block", "handler", "finalizer"], parent);
            return;
          case "VariableDeclaration":
            EvaluateChildren(node, ["declarations"], parent);
            return;
          case "VariableDeclarator":
            EvaluateChildren(node, ["id", "init"], parent);
            return;
          case "WhileStatement":
            EvaluateChildren(node, ["test", "body"], parent);
            return;
        }
      }
      const silent = hooks.beforeVisitUnknown?.(node, parent);
      if (!silent) {
        // eslint-disable-next-line no-console
        console.warn(`Unsupported node type \`${node.type}\``);
      }
    }
  }

  function BoundNamesInstantiation(
    declarations: NodeWithBoundNames | NodeWithBoundNames[] | null | undefined,
    env: AnalysisEnvironment
  ): void {
    for (const name of collectBoundNames(declarations)) {
      env.CreateBinding(name);
    }
  }

  function ResolveBinding(name: string): boolean {
    const env = getRunningContext().LexicalEnvironment;
    return GetIdentifierReference(env, name);
  }

  function GetIdentifierReference(
    env: AnalysisEnvironment | null | undefined,
    name: string
  ): boolean {
    return (
      !!env &&
      (env.HasBinding(name) || GetIdentifierReference(env.OuterEnv, name))
    );
  }

  function BlockDeclarationInstantiation(
    code: Statement[] | SwitchCase[],
    env: AnalysisEnvironment
  ): void {
    const declarations = collectScopedDeclarations(code, {
      var: false,
      topLevel: false,
    });
    BoundNamesInstantiation(declarations, env);
  }

  function CallFunction(
    closure: AnalysisFunctionObject,
    parent?: EstreeParent
  ): void {
    PrepareOrdinaryCall(closure);
    FunctionDeclarationInstantiation(closure, parent);
    Evaluate(
      closure.ECMAScriptCode,
      parent
        ?.concat({
          node: closure.Function,
          key: "body",
        })
        .concat(
          closure.Function.body.type === "BlockStatement"
            ? {
                node: closure.Function.body,
                key: "body",
              }
            : []
        )
    );
    analysisContextStack.pop();
  }

  function PrepareOrdinaryCall(F: AnalysisFunctionObject): void {
    const calleeContext = new AnalysisContext();
    const localEnv = new AnalysisEnvironment(F.Environment);
    calleeContext.VariableEnvironment = localEnv;
    calleeContext.LexicalEnvironment = localEnv;
    analysisContextStack.push(calleeContext);
  }

  function FunctionDeclarationInstantiation(
    func: AnalysisFunctionObject,
    parent?: EstreeParent
  ): void {
    const calleeContext = getRunningContext();
    const code = func.ECMAScriptCode;
    const formals = func.FormalParameters;
    const hasParameterExpressions = containsExpression(formals);
    const varDeclarations = collectScopedDeclarations(code, {
      var: true,
      topLevel: true,
    });
    const varNames = collectBoundNames(varDeclarations);

    const env = calleeContext.LexicalEnvironment!;
    BoundNamesInstantiation(formals, env);

    Evaluate(formals, parent?.concat({ node: func.Function, key: "params" }));

    let varEnv: AnalysisEnvironment;
    if (!hasParameterExpressions) {
      // NOTE: Only a single Environment Record is needed for the parameters
      // and top-level vars.
      for (const n of varNames) {
        env.CreateBinding(n);
      }
      varEnv = env;
    } else {
      // NOTE: A separate Environment Record is needed to ensure that closures
      // created by expressions in the formal parameter list do not have
      // visibility of declarations in the function body.
      varEnv = new AnalysisEnvironment(env);
      calleeContext.VariableEnvironment = varEnv;
      for (const n of varNames) {
        varEnv.CreateBinding(n);
      }
    }
    const lexEnv = varEnv;
    calleeContext.LexicalEnvironment = lexEnv;

    const lexDeclarations = collectScopedDeclarations(code, {
      var: false,
      topLevel: true,
    });
    BoundNamesInstantiation(lexDeclarations, lexEnv);
  }

  function InstantiateOrdinaryFunctionExpression(
    functionExpression: FunctionExpression
  ): AnalysisFunctionObject {
    const scope = getRunningContext().LexicalEnvironment;
    if (!functionExpression.id) {
      return OrdinaryFunctionCreate(functionExpression, scope);
    }
    const name = functionExpression.id.name;
    const funcEnv = new AnalysisEnvironment(scope);
    funcEnv.CreateBinding(name);
    return OrdinaryFunctionCreate(functionExpression, funcEnv);
  }

  function OrdinaryFunctionCreate(
    func: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
    scope?: AnalysisEnvironment
  ): AnalysisFunctionObject {
    return {
      Function: func,
      FormalParameters: func.params,
      ECMAScriptCode:
        func.body.type === "BlockStatement" ? func.body.body : func.body,
      Environment: scope,
    };
  }

  Evaluate(rootAst, withParent ? [] : undefined);

  return attemptToVisitGlobals;
}
