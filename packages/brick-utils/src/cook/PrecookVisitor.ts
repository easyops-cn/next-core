import {
  ArrayExpression,
  ArrowFunctionExpression,
  BinaryExpression,
  CallExpression,
  ConditionalExpression,
  Identifier,
  LogicalExpression,
  MemberExpression,
  ObjectExpression,
  ObjectProperty,
  OptionalCallExpression,
  OptionalMemberExpression,
  SequenceExpression,
  SpreadElement,
  TemplateLiteral,
  UnaryExpression
} from "@babel/types";
import { VisitorFn, PrecookVisitorState, PrecookScope } from "./interfaces";
import { spawnPrecookState, getScopes } from "./utils";

const PrecookVisitor: Record<string, VisitorFn<PrecookVisitorState>> = {
  ArrayExpression(node: ArrayExpression, state, callback) {
    for (const element of node.elements) {
      // 🚫Sparse arrays are not allowed.
      if (element !== null) {
        const elementState = spawnPrecookState(state);
        callback(element, elementState);
      }
    }
  },
  ArrowFunctionExpression(node: ArrowFunctionExpression, state, callback) {
    if (!node.expression) {
      // 🚫Only an `Expression` is allowed in `ArrowFunctionExpression`'s body.
      return;
    }

    const cookedParamNames: string[] = [];
    for (const param of node.params) {
      const paramState = spawnPrecookState(state, {
        identifierAsLiteralString: true
      });
      callback(
        param.type === "AssignmentPattern"
          ? param.left
          : param.type === "RestElement"
          ? param.argument
          : param,
        paramState
      );
      cookedParamNames.push(paramState.cookedIdentifierName);
    }

    const currentScope: PrecookScope = new Set(cookedParamNames);
    const bodyState: PrecookVisitorState = {
      currentScope,
      closures: getScopes(state),
      attemptToVisitGlobals: state.attemptToVisitGlobals
    };

    for (const param of node.params) {
      if (param.type === "AssignmentPattern") {
        const paramValueState = spawnPrecookState(bodyState);
        callback(param.right, paramValueState);
      }
    }

    callback(node.body, bodyState);
  },
  BinaryExpression(node: BinaryExpression, state, callback) {
    const leftState = spawnPrecookState(state);
    callback(node.left, leftState);

    const rightState = spawnPrecookState(state);
    callback(node.right, rightState);
  },
  CallExpression(node: CallExpression, state, callback) {
    const calleeState = spawnPrecookState(state);
    callback(node.callee, calleeState);

    for (const arg of node.arguments) {
      const argState = spawnPrecookState(state);
      callback(arg, argState);
    }
  },
  ConditionalExpression(node: ConditionalExpression, state, callback) {
    const testState = spawnPrecookState(state);
    callback(node.test, testState);

    const consequentState = spawnPrecookState(state);
    callback(node.consequent, consequentState);

    const alternateState = spawnPrecookState(state);
    callback(node.alternate, alternateState);
  },
  Identifier(node: Identifier, state) {
    if (state.identifierAsLiteralString) {
      state.cookedIdentifierName = node.name;
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
    const leftState = spawnPrecookState(state);
    callback(node.left, leftState);

    const rightState = spawnPrecookState(state);
    callback(node.right, rightState);
  },
  MemberExpression(node: MemberExpression, state, callback) {
    const objectState = spawnPrecookState(state);
    callback(node.object, objectState);

    const propertyState = spawnPrecookState(state, {
      identifierAsLiteralString: !node.computed
    });
    callback(node.property, propertyState);
  },
  ObjectExpression(node: ObjectExpression, state, callback) {
    for (const prop of node.properties) {
      const propState: PrecookVisitorState = spawnPrecookState(state);
      callback(prop, propState);
    }
  },
  OptionalCallExpression(node: OptionalCallExpression, state, callback) {
    const calleeState = spawnPrecookState(state);
    callback(node.callee, calleeState);

    for (const arg of node.arguments) {
      const argState = spawnPrecookState(state);
      callback(arg, argState);
    }
  },
  OptionalMemberExpression(node: OptionalMemberExpression, state, callback) {
    const objectState = spawnPrecookState(state);
    callback(node.object, objectState);

    const propertyState = spawnPrecookState(state, {
      identifierAsLiteralString: !node.computed
    });
    callback(node.property, propertyState);
  },
  Property(node: ObjectProperty, state, callback) {
    const keyState = spawnPrecookState(state, {
      identifierAsLiteralString: !node.computed
    });
    callback(node.key, keyState);

    const valueState: PrecookVisitorState = spawnPrecookState(state);
    callback(node.value, valueState);
  },
  SequenceExpression(node: SequenceExpression, state, callback) {
    let expressionState: PrecookVisitorState;
    for (const expression of node.expressions) {
      expressionState = spawnPrecookState(state);
      callback(expression, expressionState);
    }
  },
  SpreadElement(node: SpreadElement, state, callback) {
    const argumentState = spawnPrecookState(state);
    callback(node.argument, argumentState);
  },
  TemplateLiteral(node: TemplateLiteral, state, callback) {
    for (const expression of node.expressions) {
      const expressionState = spawnPrecookState(state);
      callback(expression, expressionState);
    }
  },
  UnaryExpression(node: UnaryExpression, state, callback) {
    const argumentState = spawnPrecookState(state);
    callback(node.argument, argumentState);
  }
};

export default PrecookVisitor;
