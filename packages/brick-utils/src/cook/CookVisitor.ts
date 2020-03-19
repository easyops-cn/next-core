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
  StringLiteral,
  TemplateLiteral,
  UnaryExpression
} from "@babel/types";
import {
  VisitorFn,
  CookVisitorState,
  CookScope,
  PropertyEntryCooked,
  ObjectCooked,
  PropertyCooked
} from "./interfaces";
import { spawnCookState, getScopes } from "./utils";

const CookVisitor: Record<string, VisitorFn<CookVisitorState>> = {
  ArrayExpression(
    node: ArrayExpression,
    state: CookVisitorState<any[]>,
    callback
  ) {
    const cookedElements = [];
    for (const element of node.elements) {
      if (element === null) {
        throw new SyntaxError(
          `Sparse arrays are not allowed: \`${state.source.substring(
            node.start,
            node.end
          )}\``
        );
      }
      const elementState = spawnCookState(state);
      callback(element, elementState);
      if (element.type === "SpreadElement") {
        cookedElements.push(...elementState.cooked);
      } else {
        cookedElements.push(elementState.cooked);
      }
    }
    state.cooked = cookedElements;
  },
  ArrowFunctionExpression(
    node: ArrowFunctionExpression,
    state: CookVisitorState<Function>,
    callback
  ) {
    if (!node.expression) {
      throw new SyntaxError(
        `Only an \`Expression\` is allowed in \`ArrowFunctionExpression\`'s body, but received: \`${state.source.substring(
          node.start,
          node.end
        )}\``
      );
    }

    if (node.async) {
      throw new SyntaxError(
        `Async function is not allowed, but received: \`${state.source.substring(
          node.start,
          node.end
        )}\``
      );
    }

    const cookedParamNames: string[] = [];
    for (const param of node.params) {
      const paramState: CookVisitorState<string> = spawnCookState(state, {
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
      cookedParamNames.push(paramState.cooked);
    }

    state.cooked = function(...args: any[]) {
      const currentScope: CookScope = new Map();
      const bodyState: CookVisitorState = {
        currentScope,
        closures: getScopes(state),
        source: state.source
      };

      // For function parameters, define the current scope first.
      for (const paramName of cookedParamNames) {
        currentScope.set(paramName, {
          initialized: false
        });
      }

      node.params.forEach((param, index) => {
        const argReceived =
          param.type === "RestElement" ? args.slice(index) : args[index];
        const ref = currentScope.get(cookedParamNames[index]);
        if (param.type === "AssignmentPattern") {
          if (argReceived === undefined) {
            const paramValueState = spawnCookState(bodyState);
            callback(param.right, paramValueState);
            ref.cooked = paramValueState.cooked;
          } else {
            ref.cooked = argReceived;
          }
        } else {
          ref.cooked = argReceived;
        }
        ref.initialized = true;
      });

      callback(node.body, bodyState);
      return bodyState.cooked;
    };
  },
  BinaryExpression(node: BinaryExpression, state, callback) {
    const leftState = spawnCookState(state);
    callback(node.left, leftState);
    const leftCooked = leftState.cooked;

    const rightState = spawnCookState(state);
    callback(node.right, rightState);
    const rightCooked = rightState.cooked;

    switch (node.operator) {
      case "+":
        state.cooked = leftCooked + rightCooked;
        return;
      case "-":
        state.cooked = leftCooked - rightCooked;
        return;
      case "/":
        state.cooked = leftCooked / rightCooked;
        return;
      case "%":
        state.cooked = leftCooked % rightCooked;
        return;
      case "*":
        state.cooked = leftCooked * rightCooked;
        return;
      case "==":
        state.cooked = leftCooked == rightCooked;
        return;
      case "===":
        state.cooked = leftCooked === rightCooked;
        return;
      case "!=":
        state.cooked = leftCooked != rightCooked;
        return;
      case "!==":
        state.cooked = leftCooked !== rightCooked;
        return;
      case ">":
        state.cooked = leftCooked > rightCooked;
        return;
      case "<":
        state.cooked = leftCooked < rightCooked;
        return;
      case ">=":
        state.cooked = leftCooked >= rightCooked;
        return;
      case "<=":
        state.cooked = leftCooked <= rightCooked;
        return;
    }

    throw new SyntaxError(
      `Unsupported binary operator \`${
        node.operator
      }\`: \`${state.source.substring(node.start, node.end)}\``
    );
  },
  CallExpression(node: CallExpression, state, callback) {
    const calleeState: CookVisitorState<Function> = spawnCookState(state);
    callback(node.callee, calleeState);

    const cookedArgs = [];
    for (const arg of node.arguments) {
      const argState = spawnCookState(state);
      callback(arg, argState);
      if (arg.type === "SpreadElement") {
        cookedArgs.push(...argState.cooked);
      } else {
        cookedArgs.push(argState.cooked);
      }
    }

    if (typeof calleeState.cooked !== "function") {
      throw new TypeError(
        `${state.source.substring(
          node.callee.start,
          node.callee.end
        )} is not a function`
      );
    }

    const thisArg =
      node.callee.type === "MemberExpression" ||
      node.callee.type === "OptionalMemberExpression"
        ? calleeState.memberCooked.object
        : null;

    state.cooked = calleeState.cooked.apply(thisArg, cookedArgs);
  },
  ConditionalExpression(node: ConditionalExpression, state, callback) {
    const testState = spawnCookState(state);
    callback(node.test, testState);

    if (testState.cooked) {
      const consequentState = spawnCookState(state);
      callback(node.consequent, consequentState);
      state.cooked = consequentState.cooked;
    } else {
      const alternateState = spawnCookState(state);
      callback(node.alternate, alternateState);
      state.cooked = alternateState.cooked;
    }
  },
  Identifier(node: Identifier, state: CookVisitorState<string>) {
    if (state.identifierAsLiteralString) {
      state.cooked = node.name;
      return;
    }

    const scopes = getScopes(state);
    for (const scope of scopes) {
      if (scope.has(node.name)) {
        const ref = scope.get(node.name);
        if (!ref.initialized) {
          throw new ReferenceError(
            `Cannot access '${node.name}' before initialization`
          );
        }
        state.cooked = ref.cooked;
        return;
      }
    }

    throw new ReferenceError(`${node.name} is not defined`);
  },
  Literal(node: StringLiteral, state) {
    state.cooked = node.value;
  },
  LogicalExpression(node: LogicalExpression, state, callback) {
    const leftState = spawnCookState(state);
    callback(node.left, leftState);

    const leftCooked = leftState.cooked;

    switch (node.operator) {
      case "||":
        if (leftCooked) {
          state.cooked = leftCooked;
          return;
        }
        break;
      case "&&":
        if (!leftCooked) {
          state.cooked = leftCooked;
          return;
        }
        break;
      case "??":
        if (leftCooked !== null && leftCooked !== undefined) {
          state.cooked = leftCooked;
          return;
        }
        break;
    }

    const rightState = spawnCookState(state);
    callback(node.right, rightState);

    state.cooked = rightState.cooked;
  },
  MemberExpression(node: MemberExpression, state, callback) {
    const objectState: CookVisitorState<ObjectCooked> = spawnCookState(state);
    callback(node.object, objectState);

    const propertyState: CookVisitorState<PropertyCooked> = spawnCookState(
      state,
      {
        identifierAsLiteralString: !node.computed
      }
    );
    callback(node.property, propertyState);

    state.memberCooked = {
      object: objectState.cooked,
      property: propertyState.cooked
    };

    state.cooked = objectState.cooked[propertyState.cooked];
  },
  ObjectExpression(
    node: ObjectExpression,
    state: CookVisitorState<ObjectCooked>,
    callback
  ) {
    const cookedEntries: PropertyEntryCooked[] = [];
    for (const prop of node.properties) {
      const propState: CookVisitorState<
        PropertyEntryCooked | PropertyEntryCooked[]
      > = spawnCookState(state, {
        spreadAsProperties: true
      });
      callback(prop, propState);
      const propCooked = propState.cooked;
      if (prop.type === "SpreadElement") {
        if (propCooked !== null && propCooked !== undefined) {
          cookedEntries.push(
            ...Object.entries(propCooked as PropertyEntryCooked[])
          );
        }
      } else {
        cookedEntries.push(propCooked as PropertyEntryCooked);
      }
    }
    state.cooked = Object.fromEntries(cookedEntries);
  },
  OptionalCallExpression(node: OptionalCallExpression, state, callback) {
    const calleeState: CookVisitorState<Function> = spawnCookState(state, {
      optionalRef: {}
    });
    callback(node.callee, calleeState);

    const calleeCooked = calleeState.cooked;
    if (
      (node.optional || calleeState.optionalRef.ignored) &&
      (calleeCooked === null || calleeCooked === undefined)
    ) {
      state.cooked = undefined;
      if (state.optionalRef) {
        state.optionalRef.ignored = true;
      }
      return;
    }

    const cookedArgs = [];
    for (const arg of node.arguments) {
      const argState = spawnCookState(state);
      callback(arg, argState);
      if (arg.type === "SpreadElement") {
        cookedArgs.push(...argState.cooked);
      } else {
        cookedArgs.push(argState.cooked);
      }
    }

    if (typeof calleeCooked !== "function") {
      throw new TypeError(
        `${state.source.substring(
          node.callee.start,
          node.callee.end
        )} is not a function`
      );
    }

    const thisArg =
      node.callee.type === "MemberExpression" ||
      node.callee.type === "OptionalMemberExpression"
        ? calleeState.memberCooked.object
        : null;

    state.cooked = calleeCooked.apply(thisArg, cookedArgs);
  },
  OptionalMemberExpression(node: OptionalMemberExpression, state, callback) {
    const objectState: CookVisitorState<ObjectCooked> = spawnCookState(state, {
      optionalRef: {}
    });
    callback(node.object, objectState);

    const objectCooked = objectState.cooked;
    const objectCookedIsNil =
      objectCooked === null || objectCooked === undefined;
    if (
      (node.optional || objectState.optionalRef.ignored) &&
      objectCookedIsNil
    ) {
      state.cooked = undefined;
      if (state.optionalRef) {
        state.optionalRef.ignored = true;
      }
      return;
    }

    const propertyState: CookVisitorState<PropertyCooked> = spawnCookState(
      state,
      {
        identifierAsLiteralString: !node.computed
      }
    );
    callback(node.property, propertyState);

    const propertyCooked = propertyState.cooked;
    state.memberCooked = {
      object: objectCooked,
      property: propertyCooked
    };

    if (objectCookedIsNil) {
      throw new TypeError(
        `Cannot read property '${propertyCooked}' of ${objectCooked}`
      );
    }

    state.cooked = objectCooked[propertyCooked];
  },
  Property(
    node: ObjectProperty,
    state: CookVisitorState<PropertyEntryCooked>,
    callback
  ) {
    const keyState: CookVisitorState<PropertyCooked> = spawnCookState(state, {
      identifierAsLiteralString: !node.computed
    });
    callback(node.key, keyState);

    const valueState = spawnCookState(state);
    callback(node.value, valueState);

    state.cooked = [keyState.cooked, valueState.cooked];
  },
  SequenceExpression(node: SequenceExpression, state, callback) {
    let expressionState: CookVisitorState;
    for (const expression of node.expressions) {
      expressionState = spawnCookState(state);
      callback(expression, expressionState);
    }
    state.cooked = expressionState.cooked;
  },
  SpreadElement(node: SpreadElement, state, callback) {
    const argumentState = spawnCookState(state);
    callback(node.argument, argumentState);
    const cooked = argumentState.cooked;
    if (!state.spreadAsProperties && !isIterable(cooked)) {
      throw new TypeError(
        `${typeof cooked} is not iterable: \`${state.source.substring(
          node.start,
          node.end
        )}\``
      );
    }
    state.cooked = cooked;
  },
  TemplateLiteral(node: TemplateLiteral, state, callback) {
    let index = 0;
    const chunk: string[] = [node.quasis[index].value.cooked];
    for (const expression of node.expressions) {
      const expressionState = spawnCookState(state);
      callback(expression, expressionState);
      chunk.push(String(expressionState.cooked));
      chunk.push(node.quasis[(index += 1)].value.cooked);
    }
    state.cooked = chunk.join("");
  },
  UnaryExpression(node: UnaryExpression, state, callback) {
    const argumentState = spawnCookState(state);
    callback(node.argument, argumentState);

    const argumentCooked = argumentState.cooked;

    switch (node.operator) {
      case "!":
        state.cooked = !argumentCooked;
        return;
      case "+":
        state.cooked = +argumentCooked;
        return;
      case "-":
        state.cooked = -argumentCooked;
        return;
      case "typeof":
        state.cooked = typeof argumentCooked;
        return;
      case "void":
        state.cooked = undefined;
        return;
    }

    throw new SyntaxError(
      `Unsupported unary operator \`${
        node.operator
      }\`: \`${state.source.substring(node.start, node.end)}\``
    );
  }
};

function isIterable(cooked: any): boolean {
  if (cooked === null || cooked === undefined) {
    return false;
  }
  return typeof cooked[Symbol.iterator] === "function";
}

export default CookVisitor;
