import { merge } from "lodash";
import i18next from "i18next";
import { BootstrapData } from "@next-core/brick-types";
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
      app.config = deepFreeze(merge({}, app.defaultConfig, app.userConfig));
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
