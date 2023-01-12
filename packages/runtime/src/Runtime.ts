import i18next from "i18next";
import { createHistory } from "./internal/history.js";
import { initI18n } from "./internal/i18n.js";
import { Kernel } from "./internal/Kernel.js";

const i18n = i18next as unknown as typeof i18next.default;

let kernel: Kernel;
let runtime: Runtime;

export function createRuntime() {
  if (runtime) {
    throw new Error("Cannot create multiple runtimes");
  }
  initI18n();
  // eslint-disable-next-line no-console
  console.log(i18n.language, i18n.t("translation:hello"));
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
