import { Runtime } from "./core/exports";
import { createHistory } from "./history";

let runtime: Runtime;

export function createRuntime(): Runtime {
  createHistory();
  runtime = new Runtime();
  return runtime;
}

export function getRuntime(): Runtime {
  return runtime;
}
