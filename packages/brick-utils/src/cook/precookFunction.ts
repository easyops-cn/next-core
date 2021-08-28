import { parseExpression } from "@babel/parser";
import { FunctionExpression, Node } from "@babel/types";
import {
  PrecookOptions,
  PrecookVisitorState,
  PrecookFunctionResult,
} from "./interfaces";
import { PrecookFunctionVisitor } from "./PrecookFunctionVisitor";
import { walkFactory } from "./utils";

export function precookFunction(
  source: string,
  options?: PrecookOptions
): PrecookFunctionResult {
  const func = parseExpression(source, {
    plugins: ["estree"],
    strictMode: true,
  }) as FunctionExpression;
  if (func.type !== "FunctionExpression") {
    throw new SyntaxError("Invalid function declaration");
  }
  const state: PrecookVisitorState = {
    scopeStack: [],
    attemptToVisitGlobals: new Set(),
    scopeMapByNode: new WeakMap(),
    isRoot: true,
  };
  walkFactory(
    options?.visitors
      ? { ...PrecookFunctionVisitor, ...options.visitors }
      : PrecookFunctionVisitor,
    (node: Node) => {
      // eslint-disable-next-line no-console
      console.warn(
        `Unsupported node type \`${node.type}\`: \`${source.substring(
          node.start,
          node.end
        )}\``
      );
    }
  )(func, state);
  return {
    source,
    function: func,
    attemptToVisitGlobals: state.attemptToVisitGlobals,
    scopeMapByNode: state.scopeMapByNode,
  };
}
