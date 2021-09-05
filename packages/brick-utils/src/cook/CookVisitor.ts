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
import { SimpleFunction } from "@next-core/brick-types";
import {
  CookVisitorState,
  PropertyEntryCooked,
  ObjectCooked,
  PropertyCooked,
  ChainExpression,
  ICookVisitor,
  EstreeLiteral,
} from "./interfaces";
import { CookScopeStackFactory } from "./Scope";
import { assertIterable, spawnCookState } from "./utils";

const SupportedConstructorSet = new Set([
  "Array",
  "Date",
  "Map",
  "Set",
  "URLSearchParams",
  "WeakMap",
  "WeakSet",
]);

export const CookVisitor = Object.freeze({
  ArrayExpression(
    node: ArrayExpression,
    state: CookVisitorState<unknown[]>,
    callback
  ) {
    const cookedElements: unknown[] = [];
    let index = 0;
    for (const element of node.elements) {
      if (element !== null) {
        const elementState = spawnCookState<unknown[]>(state);
        callback(element, elementState);
        if (element.type === "SpreadElement") {
          for (let i = 0; i < elementState.cooked.length; i++) {
            cookedElements[index + i] = elementState.cooked[i];
          }
          index += elementState.cooked.length;
        } else {
          cookedElements[index] = elementState.cooked;
          index += 1;
        }
      } else {
        index += 1;
      }
    }
    state.cooked = cookedElements;
  },
  ArrayPattern(node: ArrayPattern, state, callback) {
    // if (state.assignment) {
    assertIterable(
      state.assignment.rightCooked,
      state.source,
      node.start,
      node.end
    );
    const [...spreadArgs] = state.assignment.rightCooked as unknown[];
    node.elements.forEach((element, index) => {
      callback(
        element,
        spawnCookState(state, {
          assignment: {
            ...state.assignment,
            rightCooked:
              element.type === "RestElement"
                ? spreadArgs.slice(index)
                : spreadArgs[index],
          },
        })
      );
    });
    // }
  },
  ArrowFunctionExpression(
    node: ArrowFunctionExpression,
    state: CookVisitorState<SimpleFunction>,
    callback
  ) {
    if (!node.expression) {
      state.raiseError(
        SyntaxError,
        "Only an `Expression` is allowed in `ArrowFunctionExpression`'s body",
        node
      );
    }

    if (node.async) {
      state.raiseError(SyntaxError, "Async function is not allowed", node);
    }

    state.cooked = function (...args) {
      const scopeStack = CookScopeStackFactory(
        state.scopeStack,
        state.scopeMapByNode.get(node)
      );
      const bodyState = spawnCookState(state, {
        scopeStack,
      });

      node.params.forEach((param, index) => {
        const variableInitValue =
          param.type === "RestElement" ? args.slice(index) : args[index];

        const paramState = spawnCookState(bodyState, {
          assignment: {
            initializing: true,
            rightCooked: variableInitValue,
          },
        });

        callback(param, paramState);
      });

      callback(node.body, bodyState);
      return bodyState.cooked;
    };
  },
  AssignmentPattern(node: AssignmentPattern, state, callback) {
    // if (state.assignment) {
    if (state.assignment.rightCooked === undefined) {
      const paramValueState = spawnCookState(state);
      callback(node.right, paramValueState);
      callback(
        node.left,
        spawnCookState(state, {
          assignment: {
            ...state.assignment,
            rightCooked: paramValueState.cooked,
          },
        })
      );
    } else {
      callback(node.left, state);
    }
    // }
    // Should never reach here.
  },
  BinaryExpression(node: BinaryExpression, state, callback) {
    const leftState = spawnCookState<number>(state);
    callback(node.left, leftState);
    const leftCooked = leftState.cooked;

    const rightState = spawnCookState<number>(state);
    callback(node.right, rightState);
    const rightCooked = rightState.cooked;

    switch (node.operator as BinaryExpression["operator"] | "|>") {
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
      case "**":
        state.cooked = leftCooked ** rightCooked;
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
      case "|>":
        if (typeof rightCooked !== "function") {
          state.raiseError.notFunction(node.right);
        }
        state.cooked = (rightCooked as unknown as SimpleFunction)(leftCooked);
        return;
    }

    state.raiseError(
      SyntaxError,
      `Unsupported binary operator \`${node.operator}\``,
      node
    );
  },
  CallExpression(node: CallExpression, state, callback) {
    const calleeState = spawnCookState<SimpleFunction>(state, {
      chainRef: state.chainRef,
    });
    callback(node.callee, calleeState);
    const calleeCooked = calleeState.cooked;

    // Sanitize the callee.
    sanitize(calleeCooked);

    if (
      (node.optional || calleeState.chainRef?.skipped) &&
      (calleeCooked === null || calleeCooked === undefined)
    ) {
      state.cooked = undefined;
      state.chainRef.skipped = true;
      return;
    }

    const cookedArgs = [];
    for (const arg of node.arguments) {
      const argState = spawnCookState<unknown[]>(state);
      callback(arg, argState);
      if (arg.type === "SpreadElement") {
        cookedArgs.push(...argState.cooked);
      } else {
        cookedArgs.push(argState.cooked);
      }
    }

    if (typeof calleeCooked !== "function") {
      state.raiseError.notFunction(node.callee);
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
  ChainExpression(node: ChainExpression, state, callback) {
    const chainState = spawnCookState(state, {
      chainRef: {},
    });
    callback(node.expression, chainState);
    state.cooked = chainState.cooked;
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
  Identifier(node: Identifier, state: CookVisitorState) {
    if (state.identifierAsLiteralString) {
      state.cooked = node.name;
      return;
    }

    for (let i = state.scopeStack.length - 1; i >= 0; i--) {
      const ref = state.scopeStack[i].get(node.name);
      if (!ref) {
        continue;
      }
      if (state.assignment?.initializing) {
        ref.cooked = state.assignment.rightCooked;
        ref.initialized = true;
      } else if (!ref.initialized) {
        state.raiseError(
          ReferenceError,
          `Cannot access '${node.name}' before initialization`
        );
      } else if (state.assignment) {
        if (ref.const) {
          state.raiseError(TypeError, "Assignment to constant variable");
        }
        state.cooked = performAssignment(
          state,
          ref as unknown as Record<string, unknown>,
          "cooked"
        );
      } else if (state.update) {
        const prevValue = ref.cooked as number;
        ref.cooked = prevValue + (state.update.operator === "--" ? -1 : 1);
        state.cooked = state.update.prefix ? ref.cooked : prevValue;
      } else {
        state.cooked = ref.cooked;
      }
      return;
    }

    if (state.unaryOperator === "typeof") {
      state.cooked = undefined;
      return;
    }

    state.raiseError(ReferenceError, `${node.name} is not defined`);
  },
  Literal(node: EstreeLiteral, state) {
    if (node.regex) {
      if (node.value === null) {
        // Invalid regular expression fails silently in @babel/parser.
        state.raiseError(
          SyntaxError,
          `Invalid regular expression: ${node.raw}`
        );
      }
      if (node.regex.flags.includes("u")) {
        // Currently unicode flag is not fully supported across major browsers.
        state.raiseError(
          SyntaxError,
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
    const objectState = spawnCookState<ObjectCooked>(state, {
      chainRef: state.chainRef,
    });
    callback(node.object, objectState);
    const objectCooked = objectState.cooked;

    // Sanitize the member object.
    sanitize(objectCooked);

    const objectCookedIsNil =
      objectCooked === null || objectCooked === undefined;
    if ((node.optional || objectState.chainRef?.skipped) && objectCookedIsNil) {
      state.cooked = undefined;
      state.chainRef.skipped = true;
      return;
    }

    const propertyState = spawnCookState<PropertyCooked>(state, {
      identifierAsLiteralString: !node.computed,
    });
    callback(node.property, propertyState);

    const propertyCooked = propertyState.cooked;
    state.memberCooked = {
      object: objectCooked,
      property: propertyCooked,
    };

    if (objectCookedIsNil) {
      state.raiseError(
        TypeError,
        `Cannot ${
          state.assignment ? "set" : "read"
        } property '${propertyCooked}' of ${objectCooked}`
      );
    }

    if (state.assignment) {
      state.cooked = performAssignment(state, objectCooked, propertyCooked);
    } else if (state.unaryOperator !== "delete") {
      // No cooking for `delete object.property`.
      state.cooked = objectCooked[propertyCooked];
    }

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
      const propState = spawnCookState<
        PropertyEntryCooked | PropertyEntryCooked[]
      >(state, {
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
    // if (state.assignment) {
    const rightCooked = state.assignment.rightCooked;
    if (rightCooked === null || rightCooked === undefined) {
      state.raiseError(TypeError, `Cannot destructure ${rightCooked}`);
    }
    const usedProps = new Set<PropertyCooked>();
    for (const prop of node.properties) {
      if (prop.type === "RestElement") {
        callback(
          prop,
          spawnCookState(state, {
            assignment: {
              ...state.assignment,
              rightCooked: Object.fromEntries(
                Object.entries(rightCooked).filter(
                  (entry) => !usedProps.has(entry[0])
                )
              ),
            },
          })
        );
      } else {
        const keyState = spawnCookState<PropertyCooked>(state, {
          identifierAsLiteralString: true,
        });
        callback(prop.key, keyState);
        usedProps.add(keyState.cooked);
        callback(
          prop.value,
          spawnCookState(state, {
            assignment: {
              ...state.assignment,
              rightCooked:
                rightCooked[keyState.cooked as keyof typeof rightCooked],
            },
          })
        );
      }
    }
    // }
    // Should never reach here.
  },
  Property(
    node: ObjectProperty,
    state: CookVisitorState<PropertyEntryCooked>,
    callback
  ) {
    const keyState = spawnCookState<PropertyCooked>(state, {
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
    if (!state.spreadAsProperties) {
      assertIterable(cooked, state.source, node.start, node.end);
    }
    state.cooked = cooked;
  },
  TaggedTemplateExpression(node: TaggedTemplateExpression, state, callback) {
    const tagState = spawnCookState<SimpleFunction>(state);
    callback(node.tag, tagState);
    const tagCooked = tagState.cooked;

    sanitize(tagCooked);

    const tagArgs: [string[], ...unknown[]] = [
      node.quasi.quasis.map((quasi) => quasi.value.cooked),
    ];
    for (const expression of node.quasi.expressions) {
      const expressionState = spawnCookState(state);
      callback(expression, expressionState);
      tagArgs.push(expressionState.cooked);
    }

    if (typeof tagCooked !== "function") {
      state.raiseError.notFunction(node.tag);
    }

    state.cooked = tagCooked(...tagArgs);
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
    const argumentState = spawnCookState(state, {
      unaryOperator: node.operator,
    });
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
      case "delete":
        if (state.cookingFunction) {
          // In strict mode, the argument of delete operator is always a MemberExpression.
          state.cooked =
            delete argumentState.memberCooked.object[
              argumentState.memberCooked.property
            ];
          return;
        }
    }

    state.raiseError(
      SyntaxError,
      `Unsupported unary operator \`${node.operator}\``,
      node
    );
  },
  NewExpression(node: NewExpression, state, callback) {
    if (node.callee.type === "Identifier") {
      if (!SupportedConstructorSet.has((node.callee as Identifier).name)) {
        state.raiseError(
          TypeError,
          `Unsupported constructor \`${node.callee.name}\``,
          node
        );
      }

      const calleeState =
        spawnCookState<new (...args: unknown[]) => unknown>(state);
      callback(node.callee, calleeState);
      const calleeCooked = calleeState.cooked;

      if (
        calleeCooked !==
        (window as unknown as Record<string, unknown>)[
          (node.callee as Identifier).name
        ]
      ) {
        state.raiseError(
          TypeError,
          `Unsupported non-global constructor \`${node.callee.name}\``,
          node
        );
      }

      // Sanitize the callee.
      sanitize(calleeCooked);

      const cookedArgs = [];
      for (const arg of node.arguments) {
        const argState = spawnCookState<unknown[]>(state);
        callback(arg, argState);
        if (arg.type === "SpreadElement") {
          cookedArgs.push(...argState.cooked);
        } else {
          cookedArgs.push(argState.cooked);
        }
      }

      state.cooked = new calleeCooked(...cookedArgs);
    } else {
      state.raiseError(TypeError, "Unsupported new expression", node);
    }
  },
} as ICookVisitor);

// Ref https://github.com/tc39/proposal-global
// In addition, the es6-shim had to switch from Function('return this')()
// due to CSP concerns, such that the current check to handle browsers,
// node, web workers, and frames is:
// istanbul ignore next
// eslint-disable-next-line @typescript-eslint/ban-types
function getGlobal(): object {
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

function sanitize(cooked: unknown): void {
  // eslint-disable-next-line @typescript-eslint/ban-types
  if (reservedObjects.has(cooked as object)) {
    throw new TypeError("Cannot access reserved objects such as `Function`.");
  }
}

function performAssignment(
  state: CookVisitorState,
  object: Record<string, unknown>,
  property: unknown
): unknown {
  const { operator, rightCooked: value } = state.assignment;
  switch (operator) {
    case "=":
      return (object[property as keyof typeof object] = value);
    case "+=":
      return ((object[property as keyof typeof object] as number) +=
        value as number);
    case "-=":
      return ((object[property as keyof typeof object] as number) -=
        value as number);
    case "*=":
      return ((object[property as keyof typeof object] as number) *=
        value as number);
    case "/=":
      return ((object[property as keyof typeof object] as number) /=
        value as number);
    case "%=":
      return ((object[property as keyof typeof object] as number) %=
        value as number);
    case "**=":
      return ((object[property as keyof typeof object] as number) **=
        value as number);
  }

  state.raiseError(
    SyntaxError,
    `Unsupported assignment operator \`${operator}\``
  );
}
