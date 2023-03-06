import { hasOwnProperty, isObject } from "@next-core/utils/general";
import type { BrickConf, ResolveConf } from "@next-core/types";
import { asyncComputeRealValue, computeRealValue } from "./computeRealValue.js";
import { isPreEvaluated } from "./evaluate.js";
import { resolveData } from "../data/resolveData.js";
import type { RuntimeContext } from "../interfaces.js";

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

export async function asyncCheckIf(
  ifContainer: IfContainer,
  runtimeContext: RuntimeContext
): Promise<boolean> {
  return (
    !hasOwnProperty(ifContainer, "if") ||
    !!(typeof ifContainer.if === "string" || isPreEvaluated(ifContainer.if)
      ? await asyncComputeRealValue(ifContainer.if, runtimeContext)
      : ifContainer.if)
  );
}

export function checkIf(
  ifContainer: IfContainer,
  runtimeContext: RuntimeContext
): boolean {
  return (
    !hasOwnProperty(ifContainer, "if") ||
    !!(typeof ifContainer.if === "string" || isPreEvaluated(ifContainer.if)
      ? computeRealValue(ifContainer.if, runtimeContext)
      : ifContainer.if)
  );
}

export function checkIfOfComputed(ifContainer: IfContainer): boolean {
  return !hasOwnProperty(ifContainer, "if") || !!ifContainer.if;
}

export async function checkBrickIf(
  brickConf: BrickConf,
  runtimeContext: RuntimeContext
): Promise<boolean> {
  if (isObject(brickConf.if) && !isPreEvaluated(brickConf.if)) {
    const resolved = (await resolveData(
      brickConf.if as ResolveConf,
      runtimeContext
    )) as { if?: unknown };
    return checkIfOfComputed(resolved);
  }
  return asyncCheckIf(brickConf, runtimeContext);
}

export async function checkIfByTransform(
  ifContainer: IfContainer,
  data: unknown
) {
  return checkIf(ifContainer, { data } as RuntimeContext);
}
