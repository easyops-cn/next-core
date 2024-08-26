import type { Expression } from "@babel/types";
import { parseAsEstreeExpression } from "./parse.js";
import { precook, PrecookOptions } from "./precook.js";

const ASTCache = new Map<string, Expression>();

export type PreevaluateOptions = Omit<PrecookOptions, "expressionOnly"> & {
  cache?: boolean;
};

export interface PreevaluateResult {
  expression: Expression;
  attemptToVisitGlobals: Set<string>;
  source: string;
  prefix: string;
  suffix: string;
}

// `raw` should always be asserted by `isEvaluable`.
export function preevaluate(
  raw: string,
  { cache, ...restOptions }: PreevaluateOptions = {}
): PreevaluateResult {
  const fixes: string[] = [];
  const source = raw.replace(/^\s*<%[~=]?\s|\s%>\s*$/g, (m) => {
    fixes.push(m);
    return "";
  });
  let expression = cache ? ASTCache.get(source) : undefined;
  if (!expression) {
    expression = parseAsEstreeExpression(source);
    if (cache) {
      ASTCache.set(source, expression);
    }
  }
  const attemptToVisitGlobals = precook(expression, {
    ...restOptions,
    expressionOnly: true,
  });
  return {
    expression,
    attemptToVisitGlobals,
    source,
    prefix: fixes[0],
    suffix: fixes[1],
  };
}

export function isEvaluable(raw: string): boolean {
  return /^\s*<%[~=]?\s/.test(raw) && /\s%>\s*$/.test(raw);
}

export function shouldAllowRecursiveEvaluations(raw: string): boolean {
  return /^\s*<%~\s/.test(raw);
}

export function isTrackAll(raw: string): boolean {
  return /^\s*<%=\s/.test(raw) && /\s%>\s*$/.test(raw);
}

export function clearExpressionASTCache(): void {
  ASTCache.clear();
}
