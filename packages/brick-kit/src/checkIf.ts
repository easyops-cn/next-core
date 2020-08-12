import { PluginRuntimeContext } from "@easyops/brick-types";
import { hasOwnProperty } from "@easyops/brick-utils";
import { computeRealValue } from "./setProperties";
import { doTransform } from "./transformProperties";
import { isPreEvaluated } from "./evaluate";

type GetIf = (rawIf: unknown, ctx: unknown) => boolean;

export interface IfContainer {
  if?: unknown;
}

export function looseCheckIf(
  ifContainer: IfContainer,
  context: PluginRuntimeContext
): boolean {
  return (
    !hasOwnProperty(ifContainer, "if") ||
    _looseCheckIf(ifContainer.if, context, computeRealValue as GetIf)
  );
}

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
 */
export function checkIf(
  rawIf: string | boolean,
  context: PluginRuntimeContext
): boolean {
  return _checkIf(rawIf, context, computeRealValue as GetIf);
}

/**
 * @deprecated
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
