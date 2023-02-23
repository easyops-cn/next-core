import type { RuntimeStoryboard, BootstrapSettings } from "@next-core/types";
import { initializeI18n } from "@next-core/i18n/basic";
import { createHistory } from "../history.js";
import { Kernel } from "./Kernel.js";
import { matchStoryboard } from "./matchStoryboard.js";

let kernel: Kernel;
let runtime: Runtime;

export function createRuntime() {
  if (runtime) {
    throw new Error("Cannot create multiple runtimes");
  }
  initializeI18n();
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

  getFeatureFlags() {
    return {
      ...kernel.bootstrapData.settings?.featureFlags,
      ...(kernel.router.getCurrentApp()?.config?.settings as BootstrapSettings)
        ?.featureFlags,
    };
  }

  getMiscSettings() {
    return {
      ...kernel.bootstrapData.settings?.misc,
      ...(kernel.router.getCurrentApp()?.config?.settings as BootstrapSettings)
        ?.misc,
    };
  }
}

/* istanbul ignore next */
export function _internalApiGetRenderId(): string | undefined {
  if (process.env.NODE_ENV === "test") {
    return "render-id-1";
  }
  return kernel.router.getRenderId();
}

/* istanbul ignore next */
export function _internalApiMatchStoryboard(
  pathname: string
): RuntimeStoryboard | undefined {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  return matchStoryboard(kernel.bootstrapData.storyboards, pathname);
}

/* istanbul ignore next */
export function _internalApiGetRuntimeContext() {
  return kernel?.router.getRuntimeContext();
}
