import { Node } from "@babel/types";
import {
  VisitorFn,
  PrecookVisitorState,
  CookVisitorState,
  ScopeVariableKind,
  FnRaiseError,
} from "./interfaces";
import {
  CookScope,
  CookScopeStackFactory,
  FLAG_BLOCK,
  FLAG_FUNCTION,
  PrecookScope,
  VARIABLE_FLAG_CONST,
  VARIABLE_FLAG_FUNCTION,
  VARIABLE_FLAG_LET,
  VARIABLE_FLAG_PARAM,
  VARIABLE_FLAG_VAR,
} from "./Scope";

export function walkFactory<T>(
  visitor: Record<string, VisitorFn<T>>,
  catchUnsupportedNodeType: (node: Node) => void
): (node: Node, state: T) => void {
  const warnedNodes = new WeakSet();
  return function walk(node: Node, state: T) {
    const nodeVisitor = visitor[node.type];
    if (nodeVisitor) {
      nodeVisitor(node, state, walk);
    } else if (!warnedNodes.has(node)) {
      catchUnsupportedNodeType(node);
      warnedNodes.add(node);
    }
  };
}

export function spawnPrecookState(
  parentState: PrecookVisitorState,
  extendsState?: Partial<PrecookVisitorState>
): PrecookVisitorState {
  return {
    scopeStack: parentState.scopeStack,
    attemptToVisitGlobals: parentState.attemptToVisitGlobals,
    scopeMapByNode: parentState.scopeMapByNode,
    hoisting: parentState.hoisting,
    ...extendsState,
  };
}

export function spawnPrecookStateOfBlock(
  node: Node,
  state: PrecookVisitorState
): PrecookVisitorState {
  const newScope = state.hoisting
    ? new PrecookScope(FLAG_BLOCK)
    : state.scopeMapByNode.get(node);
  if (state.hoisting) {
    state.scopeMapByNode.set(node, newScope);
  }
  return spawnPrecookState(state, {
    scopeStack: state.scopeStack.concat(newScope),
  });
}

export function spawnCookState<T>(
  parentState: CookVisitorState,
  extendsState?: Partial<CookVisitorState<T>>
): CookVisitorState<T> {
  return {
    source: parentState.source,
    rules: parentState.rules,
    cookingFunction: parentState.cookingFunction,
    raiseError: parentState.raiseError,
    scopeMapByNode: parentState.scopeMapByNode,
    scopeStack: parentState.scopeStack,
    returns: parentState.returns,
    controlFlow: parentState.controlFlow,
    ...extendsState,
  };
}

export function spawnCookStateOfBlock(
  node: Node,
  state: CookVisitorState,
  extendsState?: Partial<CookVisitorState<void>>
): CookVisitorState<void> {
  return lowerLevelSpawnCookStateOfBlock(node, state, extendsState).blockState;
}

export function lowerLevelSpawnCookStateOfBlock(
  node: Node,
  state: CookVisitorState,
  extendsState?: Partial<CookVisitorState<void>>
): { blockState: CookVisitorState<void>; precookScope: PrecookScope } {
  const precookScope = state.scopeMapByNode.get(node);
  const scopeStack = CookScopeStackFactory(state.scopeStack, precookScope);
  return {
    blockState: spawnCookState(state, {
      scopeStack,
      ...extendsState,
    }),
    precookScope,
  };
}

export function addVariableToScopeStack(
  name: string,
  kind: ScopeVariableKind,
  scopeStack: PrecookScope[],
  isRoot?: boolean
): void {
  switch (kind) {
    case "param": {
      const scope = scopeStack[scopeStack.length - 1];
      scope.variables.add(name);
      scope.flagsMapByVariable.set(name, VARIABLE_FLAG_PARAM);
      break;
    }
    case "let":
    case "const": {
      const scope = findScopeByFlags(scopeStack, FLAG_FUNCTION | FLAG_BLOCK);
      scope.variables.add(name);
      scope.flagsMapByVariable.set(
        name,
        kind === "let" ? VARIABLE_FLAG_LET : VARIABLE_FLAG_CONST
      );
      break;
    }
    case "functions": {
      const scope = findScopeByFlags(scopeStack, FLAG_FUNCTION | FLAG_BLOCK);
      scope.variables.add(name);
      const prevFlags = scope.flagsMapByVariable.get(name) ?? 0;
      scope.flagsMapByVariable.set(
        name,
        prevFlags | VARIABLE_FLAG_FUNCTION | (isRoot ? VARIABLE_FLAG_CONST : 0)
      );
      break;
    }
    case "var": {
      const scope = findScopeByFlags(scopeStack, FLAG_FUNCTION);
      scope.variables.add(name);
      const prevFlags = scope.flagsMapByVariable.get(name) ?? 0;
      scope.flagsMapByVariable.set(name, prevFlags | VARIABLE_FLAG_VAR);
      break;
    }
  }
}

export function findScopeByFlags(
  scopeStack: PrecookScope[],
  flags: number
): PrecookScope;
export function findScopeByFlags(
  scopeStack: CookScope[],
  flags: number
): CookScope;
export function findScopeByFlags(
  scopeStack: PrecookScope[] | CookScope[],
  flags: number
): PrecookScope | CookScope {
  for (let i = scopeStack.length - 1; i >= 0; i--) {
    if (scopeStack[i].flags & flags) {
      return scopeStack[i];
    }
  }
}

export function assertIterable(
  cooked: unknown,
  source: string,
  start: number,
  end: number
): void {
  if (!isIterable(cooked)) {
    throw new TypeError(
      `${typeof cooked} is not iterable: \`${source.substring(start, end)}\``
    );
  }
}

export function isTerminated(state: CookVisitorState): boolean {
  return (
    state.returns.returned ||
    state.controlFlow?.broken ||
    state.controlFlow?.continued
  );
}

export function raiseErrorFactory(source: string): FnRaiseError {
  const raiseError: FnRaiseError = (error, message, node) => {
    throw new error(
      node ? `${message}: \`${getNodeSource(node, source)}\`` : message
    );
  };
  raiseError.notFunction = (node: Node) => {
    throw new TypeError(`${getNodeSource(node, source)} is not a function`);
  };
  return raiseError;
}

function getNodeSource(node: Node, source: string): string {
  return source.substring(node.start, node.end);
}

function isIterable(cooked: unknown): boolean {
  if (Array.isArray(cooked)) {
    return true;
  }
  if (cooked === null || cooked === undefined) {
    return false;
  }
  return typeof (cooked as Iterable<unknown>)[Symbol.iterator] === "function";
}
