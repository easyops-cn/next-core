import { hasOwnProperty } from "@next-core/utils/general";
import { computeRealValue } from "./compute/computeRealValue.js";
import { isPreEvaluated } from "./evaluate.js";
import { RuntimeContext } from "./RuntimeContext.js";

/**
 * 包含 `if` 条件判断的对象。
 */
export interface IfContainer {
  /**
   * 条件判断，可以为表达式字符串。
   *
   * @example
   *
   * ```yaml
   * - brick: your.any-brick
   *   if: '<% FLAGS["your-feature-flag"] %>'
   * ```
   */
  if?: unknown;
}

export async function checkIf(
  ifContainer: IfContainer,
  runtimeContext: RuntimeContext
): Promise<boolean> {
  return (
    !hasOwnProperty(ifContainer, "if") ||
    !!(typeof ifContainer.if === "string" || isPreEvaluated(ifContainer.if)
      ? await computeRealValue(ifContainer.if, runtimeContext)
      : ifContainer.if)
  );
}
