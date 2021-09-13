import {
  ArrowFunctionExpression,
  Expression,
  FunctionDeclaration,
  FunctionExpression,
  Statement,
  SwitchCase,
  VariableDeclaration,
} from "@babel/types";
import { hasOwnProperty } from "../hasOwnProperty";
import {
  AnalysisContext,
  AnalysisEnvironment,
  AnalysisFunctionObject,
} from "./AnalysisContext";
import { EstreeNode, EstreeVisitors, NodeWithBoundNames } from "./interfaces";
import {
  collectBoundNames,
  collectScopedDeclarations,
  containsExpression,
} from "./traverse";

export interface PrecookOptions {
  expressionOnly?: boolean;
  visitors?: EstreeVisitors;
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
  { expressionOnly, visitors }: PrecookOptions = {}
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
    if (hasOwnProperty(visitors, node.type)) {
      visitors[node.type](node);
    }
  }

  function Evaluate(node: EstreeNode | EstreeNode[]): void {
    if (Array.isArray(node)) {
      for (const n of node) {
        Evaluate(n);
      }
    } else if (node) {
      // `node` maybe `null` in some cases.
      visitors && visit(node);
      // Expressions:
      switch (node.type) {
        case "Identifier":
          if (!ResolveBinding(node.name)) {
            attemptToVisitGlobals.add(node.name);
          }
          return;
        case "ArrayExpression":
        case "ArrayPattern":
          Evaluate(node.elements);
          return;
        case "ArrowFunctionExpression": {
          const env = getRunningContext().LexicalEnvironment;
          const closure = OrdinaryFunctionCreate(node, env);
          CallFunction(closure);
          return;
        }
        case "AssignmentPattern":
        case "BinaryExpression":
        case "LogicalExpression":
          Evaluate(node.left);
          Evaluate(node.right);
          return;
        case "CallExpression":
        case "NewExpression":
          Evaluate(node.callee);
          Evaluate(node.arguments);
          return;
        case "ChainExpression":
          Evaluate(node.expression);
          return;
        case "ConditionalExpression":
          Evaluate(node.test);
          Evaluate(node.consequent);
          Evaluate(node.alternate);
          return;
        case "MemberExpression":
          Evaluate(node.object);
          if (node.computed) {
            Evaluate(node.property);
          }
          return;
        case "ObjectExpression":
        case "ObjectPattern":
          Evaluate(node.properties);
          return;
        case "Property":
          if (node.computed) {
            Evaluate(node.key);
          }
          Evaluate(node.value);
          return;
        case "RestElement":
        case "SpreadElement":
        case "UnaryExpression":
          Evaluate(node.argument);
          return;
        case "SequenceExpression":
        case "TemplateLiteral":
          Evaluate(node.expressions);
          return;
        case "TaggedTemplateExpression":
          Evaluate(node.tag);
          Evaluate(node.quasi);
          return;
        case "Literal":
          return;
      }
      if (!expressionOnly) {
        // Statements and assignments:
        switch (node.type) {
          case "AssignmentExpression":
            Evaluate(node.right);
            Evaluate(node.left);
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
            Evaluate(node.body);
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
            Evaluate(node.param);
            Evaluate(node.body);
            runningContext.LexicalEnvironment = oldEnv;
            return;
          }
          case "DoWhileStatement":
            Evaluate(node.body);
            Evaluate(node.test);
            return;
          case "ExpressionStatement":
          case "TSAsExpression":
            Evaluate(node.expression);
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
            Evaluate(node.right);
            runningContext.LexicalEnvironment = oldEnv;

            // ForIn/OfBodyEvaluation
            if (lexicalBinding) {
              const iterationEnv = new AnalysisEnvironment(oldEnv);
              BoundNamesInstantiation(node.left, iterationEnv);
              runningContext.LexicalEnvironment = iterationEnv;
            }
            Evaluate(node.left);
            Evaluate(node.body);
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
            Evaluate(node.init);
            Evaluate(node.test);
            Evaluate(node.body);
            Evaluate(node.update);
            runningContext.LexicalEnvironment = oldEnv;
            return;
          }
          case "FunctionDeclaration": {
            const [fn] = collectBoundNames(node);
            const env = getRunningContext().LexicalEnvironment;
            const fo = OrdinaryFunctionCreate(node, env);
            env.CreateBinding(fn);
            CallFunction(fo);
            return;
          }
          case "FunctionExpression": {
            const closure = InstantiateOrdinaryFunctionExpression(node);
            CallFunction(closure);
            return;
          }
          case "IfStatement":
            Evaluate(node.test);
            Evaluate(node.consequent);
            Evaluate(node.alternate);
            return;
          case "ReturnStatement":
          case "ThrowStatement":
          case "UpdateExpression":
            Evaluate(node.argument);
            return;
          case "SwitchCase":
            Evaluate(node.test);
            Evaluate(node.consequent);
            return;
          case "SwitchStatement": {
            Evaluate(node.discriminant);
            const runningContext = getRunningContext();
            const oldEnv = runningContext.LexicalEnvironment;
            const blockEnv = new AnalysisEnvironment(oldEnv);
            BlockDeclarationInstantiation(node.cases, blockEnv);
            runningContext.LexicalEnvironment = blockEnv;
            Evaluate(node.cases);
            runningContext.LexicalEnvironment = oldEnv;
            return;
          }
          case "TryStatement":
            Evaluate(node.block);
            Evaluate(node.handler);
            Evaluate(node.finalizer);
            return;
          case "VariableDeclaration":
            Evaluate(node.declarations);
            return;
          case "VariableDeclarator":
            Evaluate(node.id);
            Evaluate(node.init);
            return;
          case "WhileStatement":
            Evaluate(node.test);
            Evaluate(node.body);
            return;
        }
      }
      // eslint-disable-next-line no-console
      console.warn(`Unsupported node type \`${node.type}\``);
    }
  }

  function BoundNamesInstantiation(
    declarations: NodeWithBoundNames | NodeWithBoundNames[],
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
    env: AnalysisEnvironment,
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

  function CallFunction(closure: AnalysisFunctionObject): void {
    PrepareOrdinaryCall(closure);
    FunctionDeclarationInstantiation(closure);
    Evaluate(closure.ECMAScriptCode);
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
    func: AnalysisFunctionObject
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

    const env = calleeContext.LexicalEnvironment;
    BoundNamesInstantiation(formals, env);

    Evaluate(formals);

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
    {
      params,
      body,
    }: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
    scope: AnalysisEnvironment
  ): AnalysisFunctionObject {
    return {
      FormalParameters: params,
      ECMAScriptCode: body.type === "BlockStatement" ? body.body : body,
      Environment: scope,
    };
  }

  Evaluate(rootAst);

  return attemptToVisitGlobals;
}
