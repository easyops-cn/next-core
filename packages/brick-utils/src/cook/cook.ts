import { Node } from "@babel/types";
import { raiseErrorFactory, walkFactory } from "./utils";
import { CookVisitor } from "./CookVisitor";
import { CookVisitorState, PrecookResult } from "./interfaces";
import { supply } from "./supply";

export function cook<T = unknown>(
  precooked: PrecookResult,
  globalVariables?: Record<string, unknown>
): T {
  const raiseError = raiseErrorFactory(precooked.source);
  const state: CookVisitorState<T> = {
    source: precooked.source,
    raiseError,
    scopeMapByNode: precooked.scopeMapByNode,
    scopeStack: [supply(precooked.attemptToVisitGlobals, globalVariables)],
    rules: {},
  };
  walkFactory(CookVisitor, (node: Node) => {
    raiseError(SyntaxError, `Unsupported node type \`${node.type}\``, node);
  })(precooked.expression, state);
  return state.cooked;
}
