import {
  VisitorFn,
  PrecookVisitorState,
  CookVisitorState,
  PrecookScope,
  CookScope
} from "./interfaces";

export function walkFactory<T>(
  visitor: Record<string, VisitorFn<T>>,
  catchUnsupportedNodeType: (node: any) => void
): (node: any, state: T) => void {
  return function walk(node: any, state: T) {
    const nodeVisitor = visitor[node.type];
    if (nodeVisitor) {
      nodeVisitor(node, state, walk);
    } else {
      catchUnsupportedNodeType(node);
    }
  };
}

export function spawnPrecookState(
  parentState: PrecookVisitorState,
  extendsState?: Omit<
    PrecookVisitorState,
    "currentScope" | "closures" | "attemptToVisitGlobals"
  >
): PrecookVisitorState {
  return {
    currentScope: parentState.currentScope,
    closures: parentState.closures,
    attemptToVisitGlobals: parentState.attemptToVisitGlobals,
    ...extendsState
  };
}

export function spawnCookState(
  parentState: CookVisitorState,
  extendsState?: Omit<CookVisitorState, "source" | "currentScope" | "closures">
): CookVisitorState {
  return {
    source: parentState.source,
    currentScope: parentState.currentScope,
    closures: parentState.closures,
    ...extendsState
  };
}

export function getScopes(state: PrecookVisitorState): PrecookScope[];
export function getScopes(state: CookVisitorState): CookScope[];
export function getScopes(
  state: PrecookVisitorState | CookVisitorState
): (PrecookScope | CookScope)[] {
  return [state.currentScope].concat(state.closures);
}
