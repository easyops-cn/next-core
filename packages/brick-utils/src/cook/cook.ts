import { Node } from "@babel/types";
import { walkFactory } from "./utils";
import CookVisitor from "./CookVisitor";
import { CookVisitorState, PrecookResult } from "./interfaces";
import { supply } from "./supply";

export function cook(
  precooked: PrecookResult,
  globalVariables: Record<string, any> = {}
): any {
  const state: CookVisitorState = {
    source: precooked.source,
    currentScope: new Map(),
    closures: [supply(precooked.attemptToVisitGlobals, globalVariables)],
  };
  walkFactory(CookVisitor, (node: Node) => {
    throw new SyntaxError(
      `Unsupported node type \`${node.type}\`: \`${precooked.source.substring(
        node.start,
        node.end
      )}\``
    );
  })(precooked.expression, state);
  return state.cooked;
}
