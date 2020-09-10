import { Runtime } from "./core/exports";
import { createHistory } from "./history";
import { createMessageDispatcher } from "./core/MessageDispatcher";

let runtime: Runtime;

export function createRuntime(): Runtime {
  createHistory();
  createMessageDispatcher();
  runtime = new Runtime();
  return runtime;
}

export function getRuntime(): Runtime {
  return runtime;
}
