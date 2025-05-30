import {
  BootstrapStandaloneApi_runtimeStandalone,
  BootstrapV2Api_bootstrapV2,
  BootstrapV2Api_getAppStoryboardV2,
} from "@next-api-sdk/api-gateway-sdk";
import { http } from "@next-core/http";
import type {
  BootstrapData,
  BootstrapSettings,
  MicroApp,
  RuntimeStoryboard,
} from "@next-core/types";
import { deepFreeze, hasOwnProperty } from "@next-core/utils/general";
import { merge } from "lodash";
import { JSON_SCHEMA, safeLoad } from "js-yaml";
import {
  RuntimeApi_runtimeMicroAppStandalone,
  RuntimeApi_RuntimeMicroAppStandaloneResponseBody,
} from "@next-api-sdk/micro-app-standalone-sdk";
import { imagesFactory } from "./images.js";
import { registerMocks } from "./mocks.js";
import { i18n } from "@next-core/i18n";

interface StandaloneConf {
  /** The same as `auth.bootstrap.sys_settings` in api gateway conf. */
  sys_settings: StandaloneSettings;

  /** For fully standalone micro-apps. */
  user_config?: Record<string, unknown>;

  /** For mixed standalone micro-apps. */
  user_config_by_apps?: UserConfigByApps;
}

type UserConfigByApps = Record<string, Record<string, unknown>>;

interface StandaloneSettings extends Omit<BootstrapSettings, "featureFlags"> {
  feature_flags: Record<string, boolean>;
}

type BootstrapDataWithStoryboards = Omit<BootstrapData, "storyboards"> &
  Required<Pick<BootstrapData, "storyboards">>;

export function loadBootstrapData(): Promise<BootstrapDataWithStoryboards> {
  return window.STANDALONE_MICRO_APPS
    ? standaloneBootstrap()
    : (BootstrapV2Api_bootstrapV2({
        appFields:
          "defaultConfig,userConfig,locales,name,homepage,id,currentVersion,installStatus,internal,status,icons,standaloneMode",
        ignoreTemplateFields: "templates",
        ignoreBrickFields: "bricks,processors,providers,editors",
      }) as Promise<BootstrapDataWithStoryboards>);
}

async function standaloneBootstrap(): Promise<BootstrapDataWithStoryboards> {
  const requests = [
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    window.BOOTSTRAP_UNION_FILE
      ? http.get<BootstrapDataWithStoryboards>(window.BOOTSTRAP_UNION_FILE)
      : http.get<BootstrapDataWithStoryboards>(window.BOOTSTRAP_FILE!),
    window.BOOTSTRAP_UNION_FILE
      ? Promise.resolve("")
      : http.get<string>(`${window.APP_ROOT}conf.yaml`, {
          responseType: "text",
        }),
    BootstrapStandaloneApi_runtimeStandalone().catch((error) => {
      // make it not crash when the backend service is not updated.
      // eslint-disable-next-line no-console
      console.warn(
        "request runtime api from api-gateway failed: ",
        error,
        ", something might went wrong running standalone micro app"
      );
    }),

    window.BOOTSTRAP_UNION_FILE
      ? http.get<BootstrapDataWithStoryboards>(window.BOOTSTRAP_FILE!)
      : Promise.resolve(undefined),
  ] as const;

  if (!window.NO_AUTH_GUARD) {
    const matches: string[] | null = window.APP_ROOT
      ? window.APP_ROOT.match(
          /^(?:(?:\/next)?\/)?sa-static\/([^/]+)\/versions\/([^/]+)\//
        ) ||
        window.APP_ROOT.match(
          /^(?:(?:\/next)?\/)?sa-static\/micro-apps\/(?:v2|v3)\/([^/]+)\/([^/]+)\//
        )
      : null;
    if (matches) {
      // No need to wait.
      safeGetRuntimeMicroAppStandalone(matches[1], matches[2]);
    }
  }

  const [bootstrapResult, confString, runtimeData, fullBootstrapDetail] =
    await Promise.all(requests);

  mergeConf(bootstrapResult, confString);

  mergeRuntimeSettings(bootstrapResult, runtimeData?.settings);

  mergeFullBootstrapDetail(bootstrapResult, fullBootstrapDetail);

  return bootstrapResult;
}

function mergeConf(
  bootstrapResult: BootstrapDataWithStoryboards,
  confString: string
) {
  let conf: StandaloneConf | undefined;
  try {
    conf = confString
      ? (safeLoad(confString, {
          schema: JSON_SCHEMA,
          json: true,
        }) as StandaloneConf)
      : undefined;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Parse conf.yaml failed", error);
    throw new Error("Invalid conf.yaml");
  }

  if (conf) {
    const { sys_settings, user_config, user_config_by_apps } = conf;
    if (sys_settings) {
      const { feature_flags: featureFlags, ...rest } = sys_settings;
      bootstrapResult.settings = { featureFlags, ...rest } as BootstrapSettings;
    }
    if (user_config && bootstrapResult.storyboards.length === 1) {
      bootstrapResult.storyboards[0].app.userConfig = user_config;
    } else if (user_config_by_apps) {
      for (const { app } of bootstrapResult.storyboards) {
        if (hasOwnProperty(user_config_by_apps, app.id)) {
          app.userConfig = user_config_by_apps[app.id];
        }
      }
    }
  }
}

function mergeFullBootstrapDetail(
  bootstrapResult: BootstrapDataWithStoryboards,
  fullBootstrapDetail: BootstrapDataWithStoryboards | undefined
) {
  if (fullBootstrapDetail) {
    const { storyboards } = fullBootstrapDetail;
    const { routes, meta, app } = storyboards[0];

    const matchedStoryboard = bootstrapResult.storyboards.find(
      (item) => item.app.id === app.id
    );

    if (matchedStoryboard) {
      Object.assign(matchedStoryboard, {
        routes,
        meta,
        app: { ...matchedStoryboard.app, ...app },
        $$fullMerged: true,
      });
    }
  }
}

function mergeRuntimeSettings(
  bootstrapResult: BootstrapData,
  runtimeSettings: BootstrapSettings | undefined
) {
  if (!runtimeSettings) {
    return;
  }
  // Merge Feature Flags & Misc
  const { featureFlags, misc, ...rest } = runtimeSettings;
  const settings = (bootstrapResult.settings ??= {});
  settings.featureFlags = { ...settings.featureFlags, ...featureFlags };
  settings.misc = { ...settings.misc, ...misc };
  Object.assign(settings, rest);
}

const appRuntimeDataMap = new Map<
  string,
  Promise<RuntimeApi_RuntimeMicroAppStandaloneResponseBody | void>
>();

async function safeGetRuntimeMicroAppStandalone(
  appId: string,
  version = "0.0.0"
) {
  if (appRuntimeDataMap.has(appId)) {
    return appRuntimeDataMap.get(appId);
  }
  const promise = RuntimeApi_runtimeMicroAppStandalone(appId, {
    version,
  }).catch((error) => {
    // make it not crash when the backend service is not updated.
    // eslint-disable-next-line no-console
    console.warn(
      "request standalone runtime api from micro-app-standalone failed: ",
      error,
      ", something might went wrong running standalone micro app"
    );
  });
  appRuntimeDataMap.set(appId, promise);
  return promise;
}

export async function fulfilStoryboard(storyboard: RuntimeStoryboard) {
  if (window.STANDALONE_MICRO_APPS) {
    if (window.BOOTSTRAP_UNION_FILE && !storyboard.$$fullMerged) {
      const fullBootstrapPath = `${window.APP_ROOT}${
        window.PUBLIC_DEPS ? "" : "-/"
      }${storyboard.bootstrapFile}`;
      const { storyboards } =
        await http.get<BootstrapDataWithStoryboards>(fullBootstrapPath);
      const { routes, meta, app } = storyboards[0];

      Object.assign(storyboard, {
        routes,
        meta,
        app: { ...storyboard.app, ...app },
        $$fullMerged: true,
      });
    }

    if (!window.NO_AUTH_GUARD) {
      // Note: the request maybe have fired already during bootstrap.
      const appRuntimeData = await safeGetRuntimeMicroAppStandalone(
        storyboard.app.id,
        storyboard.app.currentVersion
      );
      if (appRuntimeData) {
        const { userConfig, injectMenus, blackList } = appRuntimeData;
        // Merge `app.defaultConfig` and `app.userConfig` to `app.config`.
        storyboard.app.userConfig = {
          ...storyboard.app.userConfig,
          ...userConfig,
        };

        // Initialize `overrideApp.config` in `injectMenus`
        initializeInjectMenus(injectMenus);

        // get inject menus (Actually, appRuntimeData contains both main and inject menus)
        storyboard.meta = {
          ...storyboard.meta,
          injectMenus,
          blackList,
        };
      }
    }
  } else {
    const { routes, meta, app } = await BootstrapV2Api_getAppStoryboardV2(
      storyboard.app.id,
      {}
    );
    Object.assign(storyboard, {
      routes,
      meta,
      app: { ...storyboard.app, ...app },
    });
  }

  fixStoryboardImgSrc(storyboard);
  initializeAppConfig(storyboard.app);
  initializeAppLocales(storyboard.app);
  registerMocks(storyboard.meta?.mocks);
}

function initializeAppConfig(app: MicroApp) {
  // Manually add `__merge_method: override` to avoid being deep merged.
  const mergedConfig =
    (app.userConfig?.__merge_method ?? app.defaultConfig?.__merge_method) ===
    "override"
      ? { ...app.defaultConfig, ...app.userConfig }
      : merge({}, app.defaultConfig, app.userConfig);
  app.config = deepFreeze(mergedConfig);
}

function initializeAppLocales(app: MicroApp) {
  const locales =
    (app.config?.settings as BootstrapSettings)?.locales ?? app.locales;
  if (locales) {
    // Prefix to avoid conflict between brick package's i18n namespace.
    const ns = `tmp/${app.id}`;
    // Support any languages in `app.locales`.
    Object.entries(locales).forEach(([lang, resources]) => {
      i18n.addResourceBundle(lang, ns, resources);
    });
    // Use `app.name` as the fallback `app.localeName`.
    app.localeName = i18n.getFixedT(null, ns)("name", app.name) as string;

    app.localeTitle = i18n.getFixedT(null, ns)("title", "") as string;
    // Remove the temporary i18n resource bundles.
    Object.keys(locales).forEach((lang) => {
      i18n.removeResourceBundle(lang, ns);
    });
  } else {
    app.localeName = app.name;
    app.localeTitle = "";
  }
}

// function initializeInjectMenus(menus: MenuRawData[] | undefined) {
function initializeInjectMenus(menus: any[] | undefined) {
  if (!Array.isArray(menus)) {
    return;
  }
  for (const menu of menus) {
    if (menu.overrideApp) {
      initializeAppConfig(menu.overrideApp);
      initializeAppLocales(menu.overrideApp);
    }
  }
}

function fixStoryboardImgSrc(storyboard: RuntimeStoryboard): void {
  if (
    storyboard.app.menuIcon &&
    "imgSrc" in storyboard.app.menuIcon &&
    storyboard.app.menuIcon.imgSrc?.startsWith("api/")
  ) {
    const splittedImgSrc = storyboard.app.menuIcon.imgSrc.split("/");
    const imgSrc = splittedImgSrc[splittedImgSrc.length - 1];
    const result = imagesFactory(
      storyboard.app.id,
      storyboard.app.isBuildPush,
      storyboard.app.currentVersion
    ).get(imgSrc);
    storyboard.app.menuIcon.imgSrc = result;
  }
}
