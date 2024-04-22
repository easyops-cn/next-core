import { merge } from "lodash";
import { BootstrapData } from "@next-core/brick-types";
import { deepFreeze } from "@next-core/brick-utils";

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
