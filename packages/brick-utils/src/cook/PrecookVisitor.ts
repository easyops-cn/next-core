import {
  ArrayExpression,
  ArrayPattern,
  ArrowFunctionExpression,
  AssignmentPattern,
  BinaryExpression,
  CallExpression,
  ConditionalExpression,
  Identifier,
  LogicalExpression,
  MemberExpression,
  ObjectExpression,
  ObjectPattern,
  ObjectProperty,
  OptionalCallExpression,
  OptionalMemberExpression,
  RestElement,
  SequenceExpression,
  SpreadElement,
  TemplateLiteral,
  UnaryExpression,
} from "@babel/types";
import {
  VisitorFn,
  PrecookVisitorState,
  PrecookScope,
  ChainExpression,
} from "./interfaces";
import { spawnPrecookState, getScopes } from "./utils";

const PrecookVisitor: Record<string, VisitorFn<PrecookVisitorState>> = {
  ArrayExpression(node: ArrayExpression, state, callback) {
    for (const element of node.elements) {
      // 🚫Sparse arrays are not allowed.
      if (element !== null) {
        callback(element, state);
      }
    }
  },
  ArrayPattern(node: ArrayPattern, state, callback) {
    for (const element of node.elements) {
      // 🚫Sparse arrays are not allowed.
      if (element !== null) {
        callback(element, state);
      }
    }
  },
  ArrowFunctionExpression(node: ArrowFunctionExpression, state, callback) {
    if (!node.expression) {
      // 🚫Only an `Expression` is allowed in `ArrowFunctionExpression`'s body.
      return;
    }

    const cookedParamNames: string[] = [];
    const paramState = spawnPrecookState(state, {
      collectParamNamesOnly: cookedParamNames,
    });
    for (const param of node.params) {
      callback(param, paramState);
    }

    const currentScope: PrecookScope = new Set(cookedParamNames);
    const bodyState: PrecookVisitorState = {
      currentScope,
      closures: getScopes(state),
      attemptToVisitGlobals: state.attemptToVisitGlobals,
    };

    for (const param of node.params) {
      callback(param, bodyState);
    }

    callback(node.body, bodyState);
  },
  AssignmentPattern(node: AssignmentPattern, state, callback) {
    if (state.collectParamNamesOnly) {
      callback(node.left, state);
      return;
    }
    callback(node.right, spawnPrecookState(state));
  },
  BinaryExpression(node: BinaryExpression, state, callback) {
    callback(node.left, state);
    callback(node.right, state);
  },
  CallExpression(node: CallExpression, state, callback) {
    callback(node.callee, state);
    for (const arg of node.arguments) {
      callback(arg, state);
    }
  },
  ChainExpression(node: ChainExpression, state, callback) {
    callback(node.expression, state);
  },
  ConditionalExpression(node: ConditionalExpression, state, callback) {
    callback(node.test, state);
    callback(node.consequent, state);
    callback(node.alternate, state);
  },
  Identifier(node: Identifier, state) {
    if (state.collectParamNamesOnly) {
      state.collectParamNamesOnly.push(node.name);
      return;
    }

    if (state.identifierAsLiteralString) {
      return;
    }

    const scopes = getScopes(state);
    for (const scope of scopes) {
      if (scope.has(node.name)) {
        return;
      }
    }

    state.attemptToVisitGlobals.add(node.name);
  },
  Literal() {
    // Do nothing.
  },
  LogicalExpression(node: LogicalExpression, state, callback) {
    callback(node.left, state);
    callback(node.right, state);
  },
  MemberExpression(node: MemberExpression, state, callback) {
    callback(node.object, state);
    callback(
      node.property,
      spawnPrecookState(state, {
        identifierAsLiteralString: !node.computed,
      })
    );
  },
  ObjectExpression(node: ObjectExpression, state, callback) {
    for (const prop of node.properties) {
      callback(prop, state);
    }
  },
  ObjectPattern(node: ObjectPattern, state, callback) {
    for (const prop of node.properties) {
      callback(prop, state);
    }
  },
  Property(node: ObjectProperty, state, callback) {
    callback(
      node.key,
      spawnPrecookState(state, {
        identifierAsLiteralString: !node.computed,
      })
    );
    callback(node.value, state);
  },
  RestElement(node: RestElement, state, callback) {
    callback(node.argument, state);
  },
  SequenceExpression(node: SequenceExpression, state, callback) {
    for (const expression of node.expressions) {
      callback(expression, state);
    }
  },
  SpreadElement(node: SpreadElement, state, callback) {
    callback(node.argument, state);
  },
  TemplateLiteral(node: TemplateLiteral, state, callback) {
    for (const expression of node.expressions) {
      callback(expression, state);
    }
  },
  UnaryExpression(node: UnaryExpression, state, callback) {
    callback(node.argument, state);
  },
};

export default PrecookVisitor;
