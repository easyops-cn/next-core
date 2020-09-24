import { Runtime } from "./core/exports";
import { createHistory } from "./history";
import { createMessageDispatcher } from "./core/MessageDispatcher";

let runtime: Runtime;

/** @internal */
export function createRuntime(): Runtime {
  createHistory();
  createMessageDispatcher();
  runtime = new Runtime();
  return runtime;
}

/**
 * 获取系统运行时对象。
 *
 * @example
 *
 * ```ts
 * import { getRuntime } from "@easyops/brick-kit";
 *
 * const flags = getRuntime.getFeatureFlags();
 * ```
 *
 * @returns 详见 {@link AbstractRuntime}
 */
export function getRuntime(): Runtime {
  return runtime;
}
