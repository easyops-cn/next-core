import { PluginRuntimeContext } from "@easyops/brick-types";
import { hasOwnProperty } from "@easyops/brick-utils";
import { computeRealValue } from "./setProperties";
import { doTransform } from "./transformProperties";
import { isPreEvaluated } from "./evaluate";

type GetIf = (rawIf: unknown, ctx: unknown) => unknown;

export interface IfContainer {
  if?: unknown;
}

/** @internal */
export function looseCheckIf(
  ifContainer: IfContainer,
  context: PluginRuntimeContext
): boolean {
  return (
    !hasOwnProperty(ifContainer, "if") ||
    _looseCheckIf(ifContainer.if, context, computeRealValue as GetIf)
  );
}

/**
 * 给定一个数据源，根据表达式计算条件判断的结果。
 *
 * @remarks
 *
 * 当 `ifContainer` 中没有出现 `if` 字段时，则认为条件判断为 `true`。
 *
 * 而如果 `if` 为表达式字符串时，将根据给定的数据源 `data` 进行 transform，并返回转换为 boolean 类型后的结果。
 *
 * @example
 *
 * ```ts
 * const brickConf = {
 *   if: "<% DATA.list.length > 0 %>",
 *   brick: "your.any-brick"
 * }
 * const data = { list: [] };
 * const result = looseCheckIfByTransform(
 *   brickConf,
 *   data
 * );
 * // Returns false.
 * ```
 *
 * @example
 *
 * ```ts
 * const brickConf = {
 *   if: "<% DATA.list.length %>",
 *   brick: "your.any-brick"
 * }
 * const data = { list: [ 1, 2 ] };
 * const result = looseCheckIfByTransform(
 *   brickConf,
 *   data
 * );
 * // Returns true.
 * ```
 *
 * @example
 *
 * ```ts
 * const brickConf = {
 *   brick: "your.any-brick"
 * }
 * const result = looseCheckIfByTransform(
 *   brickConf,
 *   data
 * );
 * // Returns true.
 * ```
 *
 * @param ifContainer 包含 `if` 条件判断的配置对象。
 * @param data 要传递的数据源。
 *
 * @returns 条件判断的结果。
 */
export function looseCheckIfByTransform(
  ifContainer: IfContainer,
  data: unknown
): boolean {
  return (
    !hasOwnProperty(ifContainer, "if") ||
    _looseCheckIf(ifContainer.if, data, (_rawIf, _data) =>
      doTransform(_data, _rawIf)
    )
  );
}

/** @internal */
export function looseCheckIfOfComputed(ifContainer: IfContainer): boolean {
  return !hasOwnProperty(ifContainer, "if") || !!ifContainer.if;
}

function _looseCheckIf(rawIf: unknown, ctx: unknown, fn: GetIf): boolean {
  return !!(typeof rawIf === "string" || isPreEvaluated(rawIf)
    ? fn(rawIf, ctx)
    : rawIf);
}

/**
 * @deprecated
 * @internal
 */
export function checkIf(
  rawIf: string | boolean,
  context: PluginRuntimeContext
): boolean {
  return _checkIf(rawIf, context, computeRealValue as GetIf);
}

/**
 * @deprecated
 * @internal
 */
export function checkIfByTransform(
  rawIf: string | boolean,
  data: unknown
): boolean {
  return _checkIf(rawIf, data, (_rawIf, _data) => doTransform(_data, _rawIf));
}

function _checkIf(rawIf: string | boolean, ctx: unknown, fn: GetIf): boolean {
  if (
    typeof rawIf === "boolean" ||
    typeof rawIf === "string" ||
    isPreEvaluated(rawIf)
  ) {
    const ifChecked = fn(rawIf, ctx);
    if (ifChecked === false) {
      return false;
    }
    /* istanbul ignore if */
    if (ifChecked !== true) {
      // eslint-disable-next-line no-console
      console.warn("Received an unexpected condition result:", ifChecked);
    }
  } else if (rawIf != null) {
    // eslint-disable-next-line no-console
    console.warn("Unsupported `if`:", rawIf);
  }
  return true;
}
