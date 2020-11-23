import { merge } from "lodash";
import i18next from "i18next";
import { BootstrapData } from "@easyops/brick-types";
import { deepFreeze } from "../deepFreeze";

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

      if (app.locales) {
        // Prefix to avoid conflict between brick package's i18n namespace.
        const ns = `$tmp-${app.id}`;
        // Support any languages in `app.locales`.
        Object.entries(app.locales).forEach(([lang, resources]) => {
          i18next.addResourceBundle(lang, ns, resources);
        });
        // Use `app.name` as the fallback `app.localeName`.
        app.localeName = i18next.getFixedT(null, ns)("name", app.name);
        // Remove the temporary i18n resource bundles.
        Object.keys(app.locales).forEach((lang) => {
          i18next.removeResourceBundle(lang, ns);
        });
      } else {
        app.localeName = app.name;
      }
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
