import i18next from "i18next";
import type { RuntimeStoryboard, Settings } from "@next-core/brick-types";
import { createHistory } from "../history.js";
import { initI18n } from "./i18n.js";
import { Kernel } from "./Kernel.js";
import { matchStoryboard } from "./matchStoryboard.js";

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

  getFeatureFlags() {
    return {
      ...kernel.bootstrapData.settings?.featureFlags,
      ...(kernel.router.getCurrentApp()?.config?.settings as Settings)
        ?.featureFlags,
    };
  }

  getMiscSettings() {
    return {
      ...kernel.bootstrapData.settings?.misc,
      ...(kernel.router.getCurrentApp()?.config?.settings as Settings)?.misc,
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
