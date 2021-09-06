import {
  ArrowFunctionExpression,
  AssignmentExpression,
  BlockStatement,
  BreakStatement,
  CatchClause,
  ContinueStatement,
  DoWhileStatement,
  ExpressionStatement,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  FunctionDeclaration,
  FunctionExpression,
  IfStatement,
  ReturnStatement,
  Statement,
  SwitchCase,
  SwitchStatement,
  ThrowStatement,
  TryStatement,
  TSAsExpression,
  UpdateExpression,
  VariableDeclaration,
  WhileStatement,
} from "@babel/types";
import { SimpleFunction } from "@next-core/brick-types";
import {
  CookVisitorState,
  ICookVisitor,
  VisitorCallback,
  VisitorFn,
} from "./interfaces";
import { CookVisitor } from "./CookVisitor";
import {
  assertIterable,
  isTerminated,
  spawnCookState,
  spawnCookStateOfBlock,
  lowerLevelSpawnCookStateOfBlock,
} from "./utils";

const ForOfStatementItemVisitor = (
  node: ForOfStatement | ForInStatement,
  blockState: CookVisitorState<void>,
  callback: VisitorCallback<CookVisitorState>,
  value: unknown
): void => {
  const leftState = spawnCookState(blockState, {
    assignment: {
      initializing: true,
      rightCooked: value,
    },
  });
  callback(node.left, leftState);
  callback(node.body, blockState);
};

const ForOfStatementVisitor: VisitorFn<
  CookVisitorState,
  ForOfStatement | ForInStatement
> = (node, state, callback) => {
  const blockState = spawnCookStateOfBlock(node, state, {
    breakableFlow: {},
    continuableFlow: {},
  });

  const rightState = spawnCookState<Iterable<unknown>>(blockState);
  callback(node.right, rightState);

  if (node.type === "ForOfStatement") {
    assertIterable(rightState.cooked, state.source, node.start, node.end);
    for (const value of rightState.cooked) {
      ForOfStatementItemVisitor(node, blockState, callback, value);
      blockState.continuableFlow.continued = false;
      if (isTerminated(blockState)) {
        break;
      }
    }
  } else {
    for (const value in rightState.cooked) {
      ForOfStatementItemVisitor(node, blockState, callback, value);
      blockState.continuableFlow.continued = false;
      if (isTerminated(blockState)) {
        break;
      }
    }
  }
};

const FunctionVisitor: VisitorFn<
  CookVisitorState,
  FunctionDeclaration | FunctionExpression | ArrowFunctionExpression
> = (node, state, callback) => {
  if (node.async || node.generator) {
    state.raiseError(
      SyntaxError,
      `${node.async ? "Async" : "Generator"} function is not allowed`,
      node
    );
  }

  if (
    node.type === "FunctionDeclaration" &&
    !(state.hoisting || state.isRoot)
  ) {
    return;
  }

  const bodyIsExpression =
    node.type === "ArrowFunctionExpression" && !!node.expression;

  const fn: SimpleFunction = function (...args) {
    const { precookScope, blockState } = lowerLevelSpawnCookStateOfBlock(
      node,
      state,
      {
        isFunctionBody: true,
        returns: bodyIsExpression
          ? undefined
          : {
              returned: false,
            },
        switches: undefined,
        breakableFlow: undefined,
        continuableFlow: undefined,
      }
    );

    if (node.type === "FunctionExpression" && node.id) {
      const topScope = blockState.scopeStack[blockState.scopeStack.length - 1];
      const ref = topScope.variables.get(node.id.name);
      ref.cooked = state.cooked;
      ref.initialized = true;
    }

    node.params.forEach((param, index) => {
      const variableInitValue =
        param.type === "RestElement" ? args.slice(index) : args[index];

      const paramState = spawnCookState(blockState, {
        assignment: {
          initializing: true,
          rightCooked: variableInitValue,
        },
      });

      callback(param, paramState);
    });

    for (const hoistedFn of precookScope.hoistedFunctions) {
      callback(
        hoistedFn,
        spawnCookState(blockState, {
          isFunctionBody: true,
          hoisting: true,
        })
      );
    }

    callback(node.body, blockState);

    return bodyIsExpression ? blockState.cooked : blockState.returns.cooked;
  };

  if (state.isRoot || node.type !== "FunctionDeclaration") {
    state.cooked = fn;
  }

  if (node.type === "FunctionDeclaration") {
    const topScope = state.scopeStack[state.scopeStack.length - 1];
    const ref = topScope.get(node.id.name);
    ref.cooked = fn;
    ref.initialized = true;
  }
};

const StatementListVisitor: VisitorFn<
  CookVisitorState,
  Statement[] | SwitchCase[]
> = (statements, state, callback) => {
  for (const statement of statements) {
    callback(statement, state);
    if (isTerminated(state)) {
      break;
    }
  }
};

export const CookFunctionVisitor = Object.freeze({
  ...CookVisitor,
  ArrowFunctionExpression: FunctionVisitor,
  AssignmentExpression(node: AssignmentExpression, state, callback) {
    const rightState = spawnCookState(state);
    callback(node.right, rightState);

    const leftState = spawnCookState(state, {
      assignment: {
        operator: node.operator,
        rightCooked: rightState.cooked,
      },
    });
    callback(node.left, leftState);

    state.cooked = leftState.cooked;
  },
  BlockStatement(node: BlockStatement, state, callback) {
    const { precookScope, blockState } = lowerLevelSpawnCookStateOfBlock(
      node,
      state
    );

    if (precookScope) {
      for (const hoistedFn of precookScope.hoistedFunctions) {
        callback(
          hoistedFn,
          spawnCookState(blockState, {
            hoisting: true,
          })
        );
      }
    }

    StatementListVisitor(node.body, blockState, callback);
  },
  BreakStatement(node: BreakStatement, state) {
    // istanbul ignore if
    if (node.label) {
      state.raiseError(
        SyntaxError,
        "Labeled break statement is not allowed",
        node
      );
    }
    state.breakableFlow.broken = true;
  },
  CatchClause(node: CatchClause, state, callback) {
    const blockState = spawnCookStateOfBlock(node, state);

    const paramState = spawnCookState(blockState, {
      assignment: {
        initializing: true,
        rightCooked: state.caughtError,
      },
    });
    callback(node.param, paramState);
    callback(node.body, spawnCookState(blockState));
  },
  ContinueStatement(node: ContinueStatement, state) {
    // istanbul ignore if
    if (node.label) {
      state.raiseError(
        SyntaxError,
        "Labeled continue statement is not allowed",
        node
      );
    }
    state.continuableFlow.continued = true;
  },
  DoWhileStatement(node: DoWhileStatement, state, callback) {
    let testState: CookVisitorState;
    const blockState = spawnCookState<void>(state, {
      breakableFlow: {},
      continuableFlow: {},
    });
    do {
      callback(node.body, blockState);
      blockState.continuableFlow.continued = false;
      if (isTerminated(blockState)) {
        break;
      }
    } while (
      (callback(node.test, (testState = spawnCookState(state))),
      testState.cooked)
    );
  },
  EmptyStatement() {
    // Do nothing.
  },
  ExpressionStatement(node: ExpressionStatement, state, callback) {
    callback(node.expression, spawnCookState(state));
  },
  ForInStatement: ForOfStatementVisitor,
  ForOfStatement: ForOfStatementVisitor,
  ForStatement(node: ForStatement, state, callback) {
    const blockState = spawnCookStateOfBlock(node, state, {
      breakableFlow: {},
      continuableFlow: {},
    });
    if (node.init) {
      callback(node.init, spawnCookState(blockState));
    }
    for (
      let testState: CookVisitorState;
      node.test
        ? (callback(node.test, (testState = spawnCookState(blockState))),
          testState.cooked)
        : true;
      node.update && callback(node.update, spawnCookState(blockState))
    ) {
      callback(node.body, spawnCookState(blockState));
      blockState.continuableFlow.continued = false;
      if (isTerminated(blockState)) {
        break;
      }
    }
  },
  FunctionDeclaration: FunctionVisitor,
  FunctionExpression: FunctionVisitor,
  IfStatement(node: IfStatement, state, callback) {
    const testState = spawnCookState(state);
    callback(node.test, testState);
    if (testState.cooked) {
      callback(node.consequent, spawnCookState(state));
    } else if (node.alternate) {
      callback(node.alternate, spawnCookState(state));
    }
  },
  ReturnStatement(node: ReturnStatement, state, callback) {
    const argumentState = spawnCookState(state);
    if (node.argument) {
      callback(node.argument, argumentState);
    }
    state.returns.returned = true;
    state.returns.cooked = argumentState.cooked;
  },
  SwitchCase(node: SwitchCase, state, callback) {
    if (node.test) {
      // `case …:`
      let switchContinue: boolean;
      if (state.switches.caseStage === "repeat-second") {
        switchContinue = true;
      } else {
        const caseFoundKey =
          state.switches.caseStage === "second"
            ? "caseFoundSecond"
            : "caseFound";
        switchContinue = state.switches[caseFoundKey];
        if (!switchContinue) {
          const testState = spawnCookState(state);
          callback(node.test, testState);
          switchContinue = state.switches[caseFoundKey] =
            testState.cooked === state.switches.discriminantCooked;
        }
      }
      if (switchContinue) {
        StatementListVisitor(node.consequent, state, callback);
      }
    } else {
      // `default:`
      StatementListVisitor(node.consequent, state, callback);
    }
  },
  SwitchStatement(node: SwitchStatement, state, callback) {
    const discriminantState = spawnCookState(state);
    callback(node.discriminant, discriminantState);

    const { precookScope, blockState } = lowerLevelSpawnCookStateOfBlock(
      node,
      state,
      {
        switches: {
          discriminantCooked: discriminantState.cooked,
          caseStage: "first",
        },
        breakableFlow: {},
      }
    );

    for (const hoistedFn of precookScope.hoistedFunctions) {
      callback(
        hoistedFn,
        spawnCookState(blockState, {
          hoisting: true,
        })
      );
    }

    const defaultCaseIndex = node.cases.findIndex(
      (switchCase) => !switchCase.test
    );
    const hasDefaultCase = defaultCaseIndex >= 0;
    const firstCases = hasDefaultCase
      ? node.cases.slice(0, defaultCaseIndex)
      : node.cases;
    StatementListVisitor(firstCases, blockState, callback);

    if (hasDefaultCase && !isTerminated(blockState)) {
      const secondCases = node.cases.slice(defaultCaseIndex + 1);
      blockState.switches.caseStage = "second";
      StatementListVisitor(secondCases, blockState, callback);

      if (!blockState.switches.caseFoundSecond) {
        blockState.switches.caseStage = "repeat-second";
        const restCases = node.cases.slice(defaultCaseIndex);
        StatementListVisitor(restCases, blockState, callback);
      }
    }
  },
  TSAsExpression(node: TSAsExpression, state, callback) {
    callback(node.expression, state);
  },
  ThrowStatement(node: ThrowStatement, state, callback) {
    const throwState = spawnCookState(state);
    callback(node.argument, throwState);
    throw throwState.cooked;
  },
  TryStatement(node: TryStatement, state, callback) {
    try {
      callback(node.block, spawnCookState(state));
    } catch (error) {
      if (node.handler) {
        callback(
          node.handler,
          spawnCookState(state, {
            caughtError: error,
          })
        );
      } else {
        throw error;
      }
    } finally {
      if (node.finalizer) {
        callback(node.finalizer, spawnCookState(state));
      }
    }
  },
  UpdateExpression(node: UpdateExpression, state, callback) {
    const argumentState = spawnCookState(state, {
      update: {
        operator: node.operator,
        prefix: node.prefix,
      },
    });
    callback(node.argument, argumentState);
    state.cooked = argumentState.cooked;
  },
  VariableDeclaration(node: VariableDeclaration, state, callback) {
    if (node.kind === "var" && state.rules.noVar) {
      state.raiseError(
        SyntaxError,
        "Var declaration is not recommended, use `let` or `const` instead",
        node
      );
    }
    for (const declaration of node.declarations) {
      let initCooked;
      let hasInit = false;
      if (state.assignment) {
        initCooked = state.assignment.rightCooked;
        hasInit = true;
      } else if (declaration.init) {
        const initState = spawnCookState(state);
        callback(declaration.init, initState);
        initCooked = initState.cooked;
        hasInit = true;
      }
      if (node.kind !== "var" || hasInit) {
        const idState = spawnCookState(state, {
          assignment: {
            initializing: true,
            rightCooked: initCooked,
          },
        });
        callback(declaration.id, idState);
      }
    }
  },
  WhileStatement(node: WhileStatement, state, callback) {
    let testState: CookVisitorState;
    const blockState = spawnCookState<void>(state, {
      breakableFlow: {},
      continuableFlow: {},
    });
    while (
      (callback(node.test, (testState = spawnCookState(state))),
      testState.cooked)
    ) {
      callback(node.body, blockState);
      blockState.continuableFlow.continued = false;
      if (isTerminated(blockState)) {
        break;
      }
    }
  },
} as ICookVisitor);
