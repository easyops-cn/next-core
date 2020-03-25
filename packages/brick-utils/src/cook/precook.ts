import { Node } from "@babel/types";
import { parseExpression } from "@babel/parser";
import { walkFactory } from "./utils";
import PrecookVisitor from "./PrecookVisitor";
import { PrecookVisitorState, PrecookResult } from "./interfaces";

export function precook(source: string): PrecookResult {
  const state: PrecookVisitorState = {
    currentScope: new Set(),
    closures: [],
    attemptToVisitGlobals: new Set()
  };
  const expression = parseExpression(source, {
    plugins: ["estree"]
  });
  walkFactory(PrecookVisitor, (node: Node) => {
    // eslint-disable-next-line no-console
    console.warn(
      `Unexpected node type \`${node.type}\`: \`${source.substring(
        node.start,
        node.end
      )}\``
    );
  })(expression, state);
  return {
    source,
    expression,
    attemptToVisitGlobals: state.attemptToVisitGlobals
  };
}
