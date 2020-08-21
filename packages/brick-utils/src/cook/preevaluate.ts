import { PrecookOptions, precook } from "./precook";
import { PrecookResult } from "./interfaces";

// `raw` should always be asserted to `isEvaluable`.
export function preevaluate(
  raw: string,
  options?: PrecookOptions
): PrecookResult {
  const trimmed = raw.trim();
  const source = trimmed.substring(3, trimmed.length - 3);
  try {
    return precook(source, options);
  } catch (error) {
    throw new SyntaxError(`${error.message}, in "${raw}"`);
  }
}

export function isEvaluable(raw: string): boolean {
  return /^\s*<%\s/.test(raw) && /\s%>\s*$/.test(raw);
}
