import { FunctionDeclaration } from "@babel/types";
import { parseAsEstree } from "./parse.js";
import { precook, PrecookOptions } from "./precook.js";

export interface PrecookFunctionOptions extends PrecookOptions {
  typescript?: boolean;
}

export interface PrecookFunctionResult {
  function: FunctionDeclaration;
  attemptToVisitGlobals: Set<string>;
}

export function precookFunction(
  source: string,
  { typescript, ...restOptions }: PrecookFunctionOptions = {}
): PrecookFunctionResult {
  const func = parseAsEstree(source, { typescript });
  const attemptToVisitGlobals = precook(func, restOptions);
  return {
    function: func,
    attemptToVisitGlobals,
  };
}
