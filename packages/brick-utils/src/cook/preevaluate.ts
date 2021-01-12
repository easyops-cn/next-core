import { PrecookOptions, precook } from "./precook";
import { PrecookResult } from "./interfaces";

// `raw` should always be asserted to `isEvaluable`.
export function preevaluate(
  raw: string,
  options?: PrecookOptions
): PrecookResult {
  const source = raw.replace(/^\s*<%~?\s|\s%>\s*$/g, "");
  try {
    return precook(source, options);
  } catch (error) {
    throw new SyntaxError(`${error.message}, in "${raw}"`);
  }
}

export function isEvaluable(raw: string): boolean {
  return /^\s*<%~?\s/.test(raw) && /\s%>\s*$/.test(raw);
}

export function shouldAllowRecursiveEvaluations(raw: string): boolean {
  return /^\s*<%~\s/.test(raw);
}
