import {
  BootstrapV2Api_bootstrapV2,
  BootstrapV2Api_getAppStoryboardV2,
} from "@next-api-sdk/api-gateway-sdk";
import { http } from "@next-core/http";
import type { BootstrapData, RuntimeStoryboard } from "@next-core/types";
import { i18n } from "@next-core/i18n";
import { deepFreeze } from "@next-core/utils/general";
import { merge } from "lodash";
import { registerAppI18n } from "./registerAppI18n.js";

export async function loadBootstrapData(): Promise<BootstrapData> {
  const data = await (window.STANDALONE_MICRO_APPS
    ? standaloneBootstrap()
    : (BootstrapV2Api_bootstrapV2({
        appFields:
          "defaultConfig,userConfig,locales,name,homepage,id,currentVersion,installStatus,internal,status,icons,standaloneMode",
        ignoreTemplateFields: "templates",
        ignoreBrickFields: "bricks,processors,providers,editors",
      }) as Promise<BootstrapData>));

  for (const { app } of data.storyboards) {
    if (app.locales) {
      // Prefix to avoid conflict between brick package's i18n namespace.
      const ns = `tmp/${app.id}`;
      // Support any languages in `app.locales`.
      Object.entries(app.locales).forEach(([lang, resources]) => {
        i18n.addResourceBundle(lang, ns, resources);
      });
      // Use `app.name` as the fallback `app.localeName`.
      app.localeName = i18n.getFixedT(null, ns)("name", app.name) as string;
      // Remove the temporary i18n resource bundles.
      Object.keys(app.locales).forEach((lang) => {
        i18n.removeResourceBundle(lang, ns);
      });
    } else {
      app.localeName = app.name;
    }
  }

  data.settings = deepFreeze(data.settings);
  data.brickPackages = deepFreeze(data.brickPackages);

  return data;
}

async function standaloneBootstrap(): Promise<BootstrapData> {
  const bootstrapResult = await http.get<BootstrapData>(
    window.BOOTSTRAP_FILE as string
  );
  // Todo: BootstrapStandaloneApi_runtimeStandalone
  return bootstrapResult;
}

export async function fulfilStoryboard(storyboard: RuntimeStoryboard) {
  if (storyboard.$$fulfilled) {
    return;
  }
  if (!storyboard.$$fulfilling) {
    storyboard.$$fulfilling = doFulfilStoryboard(storyboard);
  }
  return storyboard.$$fulfilling;
}

async function doFulfilStoryboard(storyboard: RuntimeStoryboard) {
  if (window.STANDALONE_MICRO_APPS) {
    Object.assign(storyboard, {
      $$fulfilled: true,
      $$fulfilling: null,
    });
    // Todo: GetRuntimeMicroAppStandalone
  } else {
    const { routes, meta, app } = await BootstrapV2Api_getAppStoryboardV2(
      storyboard.app.id,
      {}
    );
    Object.assign(storyboard, {
      routes,
      meta,
      app: { ...storyboard.app, ...app },
      $$fulfilled: true,
      $$fulfilling: null,
    });
  }

  registerAppI18n(storyboard);

  storyboard.app.config = deepFreeze(
    merge({}, storyboard.app.defaultConfig, storyboard.app.userConfig)
  );
}
