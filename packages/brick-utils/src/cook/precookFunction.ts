import { parse, ParserPlugin } from "@babel/parser";
import { FunctionDeclaration, Node, Statement } from "@babel/types";
import {
  PrecookFunctionOptions,
  PrecookVisitorState,
  PrecookFunctionResult,
} from "./interfaces";
import { PrecookFunctionVisitor } from "./PrecookFunctionVisitor";
import { FLAG_BLOCK, PrecookScope } from "./Scope";
import { walkFactory } from "./utils";

export function precookFunction(
  source: string,
  { visitors, typescript }: PrecookFunctionOptions = {}
): PrecookFunctionResult {
  const file = parse(source, {
    plugins: ["estree", typescript ? "typescript" : null].filter(
      Boolean
    ) as ParserPlugin[],
    strictMode: true,
  });
  const body = file.program.body;
  const jsNodes: Statement[] = typescript ? [] : body;
  if (typescript) {
    for (const node of body) {
      if (node.type.startsWith("TS")) {
        if (/Enum|Import|Export/.test(node.type)) {
          throw new SyntaxError(`Unsupported TypeScript syntax: ${node.type}`);
        }
      } else {
        jsNodes.push(node);
      }
    }
  }
  if (jsNodes.length === 0) {
    throw new SyntaxError("Function declaration not found");
  }
  if (jsNodes.length > 1 || jsNodes[0].type !== "FunctionDeclaration") {
    throw new SyntaxError(
      `Expect a single function declaration, but received: ${jsNodes
        .map((node) => `"${node.type}"`)
        .join(", ")}`
    );
  }
  const func = jsNodes[0] as FunctionDeclaration;
  const rootBlockScope = new PrecookScope(FLAG_BLOCK);
  const state: PrecookVisitorState = {
    scopeStack: [rootBlockScope],
    attemptToVisitGlobals: new Set(),
    scopeMapByNode: new WeakMap(),
    isRoot: true,
  };
  walkFactory(
    visitors
      ? { ...PrecookFunctionVisitor, ...visitors }
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
    rootBlockScope,
  };
}
