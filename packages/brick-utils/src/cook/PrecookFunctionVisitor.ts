import {
  ArrowFunctionExpression,
  AssignmentExpression,
  BlockStatement,
  CatchClause,
  DoWhileStatement,
  ExpressionStatement,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  FunctionDeclaration,
  FunctionExpression,
  IfStatement,
  ReturnStatement,
  SwitchCase,
  SwitchStatement,
  ThrowStatement,
  TryStatement,
  UpdateExpression,
  VariableDeclaration,
  WhileStatement,
} from "@babel/types";
import { PrecookVisitorState, VisitorFn } from "./interfaces";
import { PrecookVisitor } from "./PrecookVisitor";
import {
  FLAG_FUNCTION,
  PrecookScope,
  VARIABLE_FLAG_CONST,
  VARIABLE_FLAG_FUNCTION,
} from "./Scope";
import {
  addVariableToScopeStack,
  spawnPrecookStateOfBlock,
  spawnPrecookState,
} from "./utils";

const ForOfStatementVisitor: VisitorFn<PrecookVisitorState> = (
  node: ForInStatement | ForOfStatement,
  state,
  callback
) => {
  const blockState = spawnPrecookStateOfBlock(node, state);
  callback(node.right, blockState);
  callback(node.left, blockState);
  callback(node.body, blockState);
};

const FunctionVisitor: VisitorFn<PrecookVisitorState> = (
  node: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
  state,
  callback
) => {
  if (!state.isRoot && node.type !== "FunctionDeclaration" && state.hoisting) {
    return;
  }

  if (node.type === "FunctionDeclaration") {
    if (state.hoisting) {
      addVariableToScopeStack(node.id.name, "functions", state.scopeStack);
      const topScope = state.scopeStack[state.scopeStack.length - 1];
      topScope.hoistedFunctions.add(node);
      return;
    }
  }

  const newScope = new PrecookScope(FLAG_FUNCTION);

  if (node.type === "FunctionExpression" && node.id) {
    newScope.variables.add(node.id.name);
    // A function expression itself is considered as const.
    newScope.flagsMapByVariable.set(
      node.id.name,
      VARIABLE_FLAG_CONST | VARIABLE_FLAG_FUNCTION
    );
  }

  const bodyState: PrecookVisitorState = spawnPrecookState(state, {
    scopeStack: state.scopeStack.concat(newScope),
    isFunctionBody: true,
  });
  state.scopeMapByNode.set(node, newScope);

  const paramState = spawnPrecookState(bodyState, {
    collectVariableNamesAsKind: "param",
  });
  for (const param of node.params) {
    callback(param, paramState);
  }

  for (const param of node.params) {
    callback(param, bodyState);
  }

  // Collect hoist var and function declarations first.
  callback(
    node.body,
    spawnPrecookState(bodyState, {
      isFunctionBody: true,
      hoisting: true,
    })
  );

  callback(node.body, bodyState);
};

export const PrecookFunctionVisitor = Object.freeze<
  Record<string, VisitorFn<PrecookVisitorState>>
>({
  ...PrecookVisitor,
  ArrowFunctionExpression: FunctionVisitor,
  AssignmentExpression(node: AssignmentExpression, state, callback) {
    callback(node.right, state);
    callback(node.left, state);
  },
  BlockStatement(node: BlockStatement, state, callback) {
    const bodyState = state.isFunctionBody
      ? spawnPrecookState(state)
      : spawnPrecookStateOfBlock(node, state);
    for (const statement of node.body) {
      callback(statement, bodyState);
    }
  },
  BreakStatement() {
    // Do nothing.
  },
  CatchClause(node: CatchClause, state, callback) {
    const blockState = spawnPrecookStateOfBlock(node, state);
    callback(
      node.param,
      spawnPrecookState(blockState, {
        collectVariableNamesAsKind: "let",
      })
    );
    callback(node.body, blockState);
  },
  ContinueStatement() {
    // Do nothing.
  },
  EmptyStatement() {
    // Do nothing.
  },
  ExpressionStatement(node: ExpressionStatement, state, callback) {
    callback(node.expression, state);
  },
  ForInStatement: ForOfStatementVisitor,
  ForOfStatement: ForOfStatementVisitor,
  ForStatement(node: ForStatement, state, callback) {
    const blockState = spawnPrecookStateOfBlock(node, state);
    if (node.init) {
      callback(node.init, blockState);
    }
    if (node.test) {
      callback(node.test, blockState);
    }
    callback(node.body, blockState);
    if (node.update) {
      callback(node.update, blockState);
    }
  },
  FunctionDeclaration: FunctionVisitor,
  FunctionExpression: FunctionVisitor,
  IfStatement(node: IfStatement, state, callback) {
    callback(node.test, state);
    callback(node.consequent, state);
    if (node.alternate) {
      callback(node.alternate, state);
    }
  },
  ReturnStatement(node: ReturnStatement, state, callback) {
    if (node.argument) {
      callback(node.argument, state);
    }
  },
  SwitchCase(node: SwitchCase, state, callback) {
    if (node.test) {
      callback(node.test, state);
    }
    for (const statement of node.consequent) {
      callback(statement, state);
    }
  },
  SwitchStatement(node: SwitchStatement, state, callback) {
    const blockState = spawnPrecookStateOfBlock(node, state);
    callback(node.discriminant, state);
    for (const switchCase of node.cases) {
      callback(switchCase, blockState);
    }
  },
  ThrowStatement(node: ThrowStatement, state, callback) {
    callback(node.argument, state);
  },
  TryStatement(node: TryStatement, state, callback) {
    callback(node.block, state);
    if (node.handler) {
      callback(node.handler, state);
    }
    if (node.finalizer) {
      callback(node.finalizer, state);
    }
  },
  UpdateExpression(node: UpdateExpression, state, callback) {
    callback(node.argument, state);
  },
  VariableDeclaration(node: VariableDeclaration, state, callback) {
    if (state.hoisting) {
      for (const declaration of node.declarations) {
        callback(
          declaration.id,
          spawnPrecookState(state, {
            collectVariableNamesAsKind: node.kind,
          })
        );
      }
    }

    for (const declaration of node.declarations) {
      callback(declaration.id, state);
      if (declaration.init) {
        callback(declaration.init, state);
      }
    }
  },
  WhileStatement(node: WhileStatement, state, callback) {
    callback(node.test, state);
    callback(node.body, state);
  },
  DoWhileStatement(node: DoWhileStatement, state, callback) {
    callback(node.body, state);
    callback(node.test, state);
  },
});
