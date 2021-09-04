import { Node } from "@babel/types";
import { SimpleFunction } from "@next-core/brick-types";
import { raiseErrorFactory, walkFactory } from "./utils";
import { CookFunctionVisitor } from "./CookFunctionVisitor";
import {
  CookFunctionOptions,
  CookVisitorState,
  PrecookFunctionResult,
} from "./interfaces";
import { supply } from "./supply";
import { CookScopeFactory } from "./Scope";

export function cookFunction<T extends SimpleFunction>(
  precooked: PrecookFunctionResult,
  { rules = {}, globalVariables }: CookFunctionOptions = {}
): T {
  const raiseError = raiseErrorFactory(precooked.source);
  const state: CookVisitorState<T> = {
    source: precooked.source,
    raiseError,
    scopeMapByNode: precooked.scopeMapByNode,
    scopeStack: [
      supply(precooked.attemptToVisitGlobals, globalVariables),
      CookScopeFactory(precooked.rootBlockScope),
    ],
    isRoot: true,
    rules,
  };
  walkFactory(CookFunctionVisitor, (node: Node) => {
    raiseError(SyntaxError, `Unsupported node type \`${node.type}\``, node);
  })(precooked.function, state);
  return state.cooked;
}
