import { parse, parseExpression, type ParserPlugin } from "@babel/parser";
import type { Expression, FunctionDeclaration, Statement } from "@babel/types";

export function parseAsEstreeExpression(source: string): Expression {
  return parseExpression(source, {
    plugins: ["estree", ["pipelineOperator", { proposal: "minimal" }]],
    attachComment: false,
  });
}

export interface ParseEstreeOptions {
  typescript?: boolean;
}

export function parseAsEstree(
  source: string,
  { typescript }: ParseEstreeOptions = {}
): FunctionDeclaration {
  const file = parse(source, {
    plugins: ["estree", typescript && "typescript"].filter(
      Boolean
    ) as ParserPlugin[],
    strictMode: true,
    attachComment: false,
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
      `Expect a single function declaration at top level, but received: ${jsNodes
        .map((node) => `"${node.type}"`)
        .join(", ")}`
    );
  }
  return jsNodes[0] as FunctionDeclaration;
}
