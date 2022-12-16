import { createHistory } from "./internal/history.js";
import { Kernel } from "./internal/Kernel.js";

let kernel: Kernel;
let runtime: Runtime;

export function createRuntime() {
  createHistory();
  runtime = new Runtime();
  return runtime;
}

export function getRuntime() {
  return runtime;
}

export class Runtime {
  bootstrap() {
    kernel = new Kernel();
    return kernel.bootstrap();
  }
}
