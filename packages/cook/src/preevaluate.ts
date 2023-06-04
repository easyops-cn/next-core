import { Expression } from "@babel/types";
import { parseAsEstreeExpression } from "./parse";
import { precook, PrecookOptions } from "./precook";

export type PreevaluateOptions = Omit<PrecookOptions, "expressionOnly">;

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
  options?: PreevaluateOptions
): PreevaluateResult {
  const fixes: string[] = [];
  const source = raw.replace(/^\s*<%[~=!@]?\s|\s%>\s*$/g, (m) => {
    fixes.push(m);
    return "";
  });
  const expression = parseAsEstreeExpression(source);
  const attemptToVisitGlobals = precook(expression, {
    ...options,
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
  return /^\s*<%[~=!@]?\s/.test(raw) && /\s%>\s*$/.test(raw);
}

export function shouldAllowRecursiveEvaluations(raw: string): boolean {
  return /^\s*<%~\s/.test(raw);
}

export function isSnippetEvaluations(raw: string): boolean {
  return /^\s*<%[!@]\s/.test(raw) && /\s%>\s*$/.test(raw);
}

export function isTrackAll(raw: string): boolean {
  return /^\s*<%=\s/.test(raw) && /\s%>\s*$/.test(raw);
}
