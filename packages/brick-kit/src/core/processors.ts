import { merge } from "lodash";
import { BootstrapData } from "@easyops/brick-types";
import { scanRouteAliasInStoryboard } from "@easyops/brick-utils";

// Merge `app.defaultConfig` and `app.userConfig` to `app.config`.
// And compute `app.$$routeAliasMap`.
export function processBootstrapResponse(
  bootstrapResponse: BootstrapData
): void {
  for (const storyboard of bootstrapResponse.storyboards) {
    const app = storyboard.app;
    if (app) {
      storyboard.app = {
        ...app,
        config: merge({}, app.defaultConfig, app.userConfig),
        $$routeAliasMap: scanRouteAliasInStoryboard(storyboard),
      };
    }
  }
}
