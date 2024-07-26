import type { FunctionDeclaration } from "@babel/types";
import { parseAsEstree } from "./parse.js";
import { precook, PrecookOptions } from "./precook.js";

let ASTCache = new WeakMap<object, FunctionDeclaration>();

export interface PrecookFunctionOptions extends PrecookOptions {
  cacheKey?: object;
  typescript?: boolean;
}

export interface PrecookFunctionResult {
  function: FunctionDeclaration;
  attemptToVisitGlobals: Set<string>;
}

export function precookFunction(
  source: string,
  { typescript, cacheKey, ...restOptions }: PrecookFunctionOptions = {}
): PrecookFunctionResult {
  let func = cacheKey ? ASTCache.get(cacheKey) : undefined;
  if (!func) {
    func = parseAsEstree(source, { typescript });
    if (cacheKey) {
      ASTCache.set(cacheKey, func);
    }
  }
  const attemptToVisitGlobals = precook(func, restOptions);
  return {
    function: func,
    attemptToVisitGlobals,
  };
}

export function clearFunctionASTCache(): void {
  ASTCache = new WeakMap();
}
