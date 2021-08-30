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
  NewExpression,
  ObjectExpression,
  ObjectPattern,
  ObjectProperty,
  RestElement,
  SequenceExpression,
  SpreadElement,
  TaggedTemplateExpression,
  TemplateLiteral,
  UnaryExpression,
} from "@babel/types";
import { VisitorFn, PrecookVisitorState, ChainExpression } from "./interfaces";
import { FLAG_FUNCTION, PrecookScope } from "./Scope";
import { addVariableToScopeStack, spawnPrecookState } from "./utils";

export const PrecookVisitor = Object.freeze<
  Record<string, VisitorFn<PrecookVisitorState>>
>({
  ArrayExpression(node: ArrayExpression, state, callback) {
    for (const element of node.elements) {
      if (element !== null) {
        callback(element, state);
      }
    }
  },
  ArrayPattern(node: ArrayPattern, state, callback) {
    for (const element of node.elements) {
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

    const newScope = new PrecookScope(FLAG_FUNCTION);
    const newScopeStack = state.scopeStack.concat(newScope);
    const bodyState = spawnPrecookState(state, {
      scopeStack: newScopeStack,
    });
    state.scopeMapByNode.set(node, newScope);

    const collectParamNamesState = spawnPrecookState(bodyState, {
      collectVariableNamesAsKind: "param",
    });
    for (const param of node.params) {
      callback(param, collectParamNamesState);
    }

    for (const param of node.params) {
      callback(param, bodyState);
    }

    callback(node.body, bodyState);
  },
  AssignmentPattern(node: AssignmentPattern, state, callback) {
    if (state.collectVariableNamesAsKind) {
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
    if (state.collectVariableNamesAsKind) {
      addVariableToScopeStack(
        node.name,
        state.collectVariableNamesAsKind,
        state.scopeStack
      );
      return;
    }

    if (state.identifierAsLiteralString || state.hoisting) {
      return;
    }

    for (let i = state.scopeStack.length - 1; i >= 0; i--) {
      if (state.scopeStack[i].has(node.name)) {
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
  TaggedTemplateExpression(node: TaggedTemplateExpression, state, callback) {
    callback(node.tag, state);
    callback(node.quasi, state);
  },
  TemplateLiteral(node: TemplateLiteral, state, callback) {
    for (const expression of node.expressions) {
      callback(expression, state);
    }
  },
  UnaryExpression(node: UnaryExpression, state, callback) {
    callback(node.argument, state);
  },
  NewExpression(node: NewExpression, state, callback) {
    callback(node.callee, state);
    for (const arg of node.arguments) {
      callback(arg, state);
    }
  },
});
