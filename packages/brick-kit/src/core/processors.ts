import { merge } from "lodash";
import { BootstrapData, type MicroApp } from "@next-core/brick-types";
import { deepFreeze } from "@next-core/brick-utils";
import { setAppLocales } from "./setAppLocales";

/**
 * Merge `app.defaultConfig` and `app.userConfig` to `app.config`.
 *
 * @param bootstrapResponse - Response of bootstrap API.
 */
export function processBootstrapResponse(
  bootstrapResponse: BootstrapData
): void {
  for (const storyboard of bootstrapResponse.storyboards) {
    const app = storyboard.app;
    if (app) {
      initializeAppConfig(app);
      setAppLocales(storyboard.app);
    }
  }

  if (bootstrapResponse.settings) {
    bootstrapResponse.settings = deepFreeze(bootstrapResponse.settings);
  }

  bootstrapResponse.brickPackages = deepFreeze(bootstrapResponse.brickPackages);
  bootstrapResponse.templatePackages = deepFreeze(
    bootstrapResponse.templatePackages
  );
}

export function initializeAppConfig(app: MicroApp): void {
  // Manually add `__merge_method: override` to `app.userConfig` to avoid being deep merged.
  const mergedConfig =
    (app.userConfig?.__merge_method ?? app.defaultConfig?.__merge_method) ===
    "override"
      ? {
          ...app.defaultConfig,
          ...app.userConfig,
        }
      : merge({}, app.defaultConfig, app.userConfig);
  app.config = deepFreeze(mergedConfig);
}
