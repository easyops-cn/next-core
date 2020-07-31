import { PluginRuntimeContext } from "@easyops/brick-types";
import { computeRealValue } from "./setProperties";
import { doTransform } from "./transformProperties";
import { isPreEvaluated } from "./evaluate";

type GetIf = (rawIf: string | boolean, ctx: any) => boolean;

export function checkIf(
  rawIf: string | boolean,
  context: PluginRuntimeContext
): boolean {
  return _checkIf(rawIf, context, computeRealValue);
}

export function checkIfByTransform(
  rawIf: string | boolean,
  data: any
): boolean {
  return _checkIf(rawIf, data, (_rawIf, _data) => doTransform(_data, _rawIf));
}

function _checkIf(rawIf: string | boolean, ctx: any, fn: GetIf): boolean {
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
