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
  CookVisitorState,
  CookScope,
  PropertyEntryCooked,
  ObjectCooked,
  PropertyCooked,
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
  ArrayPattern(node: ArrayPattern, state, callback) {
    if (state.cookParamOnly) {
      if (!isIterable(state.argReceived)) {
        throw new TypeError(
          `${typeof state.argReceived} is not iterable: \`${state.source.substring(
            node.start,
            node.end
          )}\``
        );
      }
      const [...spreadArgs] = state.argReceived;
      node.elements.forEach((element, index) => {
        callback(
          element,
          spawnCookState(state, {
            cookParamOnly: true,
            argReceived:
              element.type === "RestElement"
                ? spreadArgs.slice(index)
                : spreadArgs[index],
          })
        );
      });
      return;
    }

    // istanbul ignore else
    if (state.collectParamNamesOnly) {
      node.elements.forEach((element) => {
        if (element === null) {
          throw new SyntaxError(
            `Sparse arrays are not allowed: \`${state.source.substring(
              node.start,
              node.end
            )}\``
          );
        }
        callback(element, state);
      });
    }
    // Should nerve reach here.
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
    const paramState: CookVisitorState<string> = spawnCookState(state, {
      collectParamNamesOnly: cookedParamNames,
    });
    for (const param of node.params) {
      callback(param, paramState);
    }

    state.cooked = function (...args: any[]) {
      const currentScope: CookScope = new Map();
      const bodyState: CookVisitorState = {
        currentScope,
        closures: getScopes(state),
        source: state.source,
      };

      // For function parameters, define the current scope first.
      for (const paramName of cookedParamNames) {
        currentScope.set(paramName, {
          initialized: false,
        });
      }

      node.params.forEach((param, index) => {
        const argReceived =
          param.type === "RestElement" ? args.slice(index) : args[index];

        const paramState = spawnCookState(bodyState, {
          cookParamOnly: true,
          argReceived,
        });

        callback(param, paramState);
      });

      callback(node.body, bodyState);
      return bodyState.cooked;
    };
  },
  AssignmentPattern(node: AssignmentPattern, state, callback) {
    if (state.cookParamOnly) {
      if (state.argReceived === undefined) {
        const paramValueState = spawnCookState(state);
        callback(node.right, paramValueState);
        callback(
          node.left,
          spawnCookState(state, {
            cookParamOnly: true,
            argReceived: paramValueState.cooked,
          })
        );
      } else {
        callback(node.left, state);
      }
      return;
    }

    // istanbul ignore else
    if (state.collectParamNamesOnly) {
      callback(node.left, state);
    }
    // Should nerve reach here.
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

    // Sanitize the callee.
    sanitize(calleeState.cooked);

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

    // Sanitize the call result.
    sanitize(state.cooked);
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
    if (state.cookParamOnly) {
      const ref = state.currentScope.get(node.name);
      ref.cooked = state.argReceived;
      ref.initialized = true;
      return;
    }
    if (state.collectParamNamesOnly) {
      state.collectParamNamesOnly.push(node.name);
      return;
    }
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
  Literal(node: any, state) {
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

    // Sanitize the member object.
    sanitize(objectState.cooked);

    const propertyState: CookVisitorState<PropertyCooked> = spawnCookState(
      state,
      {
        identifierAsLiteralString: !node.computed,
      }
    );
    callback(node.property, propertyState);

    state.memberCooked = {
      object: objectState.cooked,
      property: propertyState.cooked,
    };

    state.cooked = objectState.cooked[propertyState.cooked];

    // Sanitize the accessed member.
    sanitize(state.cooked);
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
        spreadAsProperties: true,
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
  ObjectPattern(node: ObjectPattern, state, callback) {
    if (state.cookParamOnly) {
      if (state.argReceived === null || state.argReceived === undefined) {
        throw new TypeError(`Cannot destructure ${state.argReceived}`);
      }
      const usedProps = new Set<PropertyCooked>();
      for (const prop of node.properties) {
        if (prop.type === "RestElement") {
          callback(
            prop,
            spawnCookState(state, {
              cookParamOnly: true,
              argReceived: Object.fromEntries(
                Object.entries(state.argReceived).filter(
                  (entry) => !usedProps.has(entry[0])
                )
              ),
            })
          );
        } else {
          const keyState: CookVisitorState<PropertyCooked> = spawnCookState(
            state,
            {
              identifierAsLiteralString: true,
            }
          );
          callback(prop.key, keyState);
          usedProps.add(keyState.cooked);
          callback(
            prop.value,
            spawnCookState(state, {
              cookParamOnly: true,
              argReceived: state.argReceived[keyState.cooked],
            })
          );
        }
      }
      return;
    }

    // istanbul ignore else
    if (state.collectParamNamesOnly) {
      for (const prop of node.properties) {
        callback(prop, state);
      }
    }
    // Should nerve reach here.
  },
  OptionalCallExpression(node: OptionalCallExpression, state, callback) {
    const calleeState: CookVisitorState<Function> = spawnCookState(state, {
      optionalRef: {},
    });
    callback(node.callee, calleeState);
    const calleeCooked = calleeState.cooked;

    // Sanitize the callee.
    sanitize(calleeCooked);

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

    // Sanitize the call result.
    sanitize(state.cooked);
  },
  OptionalMemberExpression(node: OptionalMemberExpression, state, callback) {
    const objectState: CookVisitorState<ObjectCooked> = spawnCookState(state, {
      optionalRef: {},
    });
    callback(node.object, objectState);
    const objectCooked = objectState.cooked;

    // Sanitize the member object.
    sanitize(objectCooked);

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
        identifierAsLiteralString: !node.computed,
      }
    );
    callback(node.property, propertyState);

    const propertyCooked = propertyState.cooked;
    state.memberCooked = {
      object: objectCooked,
      property: propertyCooked,
    };

    if (objectCookedIsNil) {
      throw new TypeError(
        `Cannot read property '${propertyCooked}' of ${objectCooked}`
      );
    }

    state.cooked = objectCooked[propertyCooked];

    // Sanitize the accessed member.
    sanitize(state.cooked);
  },
  Property(
    node: ObjectProperty,
    state: CookVisitorState<PropertyEntryCooked>,
    callback
  ) {
    if (state.collectParamNamesOnly) {
      callback(node.value, state);
      return;
    }

    const keyState: CookVisitorState<PropertyCooked> = spawnCookState(state, {
      identifierAsLiteralString: !node.computed,
    });
    callback(node.key, keyState);

    const valueState = spawnCookState(state);
    callback(node.value, valueState);

    state.cooked = [keyState.cooked, valueState.cooked];
  },
  RestElement(node: RestElement, state, callback) {
    callback(node.argument, state);
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
  },
};

function isIterable(cooked: any): boolean {
  if (Array.isArray(cooked)) {
    return true;
  }
  if (cooked === null || cooked === undefined) {
    return false;
  }
  return typeof cooked[Symbol.iterator] === "function";
}

// Ref https://github.com/tc39/proposal-global
// In addition, the es6-shim had to switch from Function('return this')()
// due to CSP concerns, such that the current check to handle browsers,
// node, web workers, and frames is:
// istanbul ignore next
function getGlobal(): any {
  // the only reliable means to get the global object is
  // `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("unable to locate global object");
}

/**
 * There are chances to construct a `Function` from a string, etc.
 * ```
 * ((a,b)=>a[b])(()=>1, 'constructor')('console.log(`yo`)')()
 * ```
 */
const reservedObjects = new WeakSet([
  // `Function("...")` is considered *extremely vulnerable*.
  Function,
  // `Object.assign()` is considered vulnerable.
  Object,
  // `prototype` is considered vulnerable.
  Function.prototype,
  Object.prototype,
  // Global `window` is considered vulnerable, too.
  getGlobal(),
]);

function sanitize(cooked: any): void {
  if (reservedObjects.has(cooked)) {
    throw new TypeError("Cannot access reserved objects such as `Function`.");
  }
}

export default CookVisitor;
