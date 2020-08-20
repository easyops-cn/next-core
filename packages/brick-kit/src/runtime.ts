import { Runtime } from "./core/exports";
import { createHistory } from "./history";
import { createWebSocket } from "./websocket/WebSocket";
import { createMessageDispatcher } from "./core/MessageDispatcher";

let runtime: Runtime;

export function createRuntime(): Runtime {
  createHistory();
  createWebSocket();
  createMessageDispatcher();
  runtime = new Runtime();
  return runtime;
}

export function getRuntime(): Runtime {
  return runtime;
}
