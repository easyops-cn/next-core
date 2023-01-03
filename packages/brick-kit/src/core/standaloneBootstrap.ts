import yaml from "js-yaml";
import { http } from "@next-core/brick-http";
import {
  BootstrapStandaloneApi_runtimeStandalone,
  BootstrapStandaloneApi_RuntimeStandaloneResponseBody,
} from "@next-sdk/api-gateway-sdk";
import { BootstrapData, Settings } from "@next-core/brick-types";
import { hasOwnProperty } from "@next-core/brick-utils";
import { isEmpty } from "lodash";
import {
  RuntimeApi_runtimeMicroAppStandalone,
  RuntimeApi_RuntimeMicroAppStandaloneResponseBody,
} from "@next-sdk/micro-app-standalone-sdk";

interface StandaloneConf {
  /** The same as `auth.bootstrap.sys_settings` in api gateway conf. */
  sys_settings: StandaloneSettings;

  /** For fully standalone micro-apps. */
  user_config?: Record<string, unknown>;

  /** For mixed standalone micro-apps. */
  user_config_by_apps?: UserConfigByApps;
}

type UserConfigByApps = Record<string, Record<string, unknown>>;

interface StandaloneSettings extends Omit<Settings, "featureFlags"> {
  feature_flags: Record<string, boolean>;
}

export async function standaloneBootstrap(): Promise<BootstrapData> {
  const requests: [
    Promise<BootstrapData>,
    Promise<string>,
    Promise<BootstrapStandaloneApi_RuntimeStandaloneResponseBody | void>
  ] = [
    http.get<BootstrapData>(window.BOOTSTRAP_FILE),
    http.get<string>(`${window.APP_ROOT}conf.yaml`, {
      responseType: "text",
    }),
    BootstrapStandaloneApi_runtimeStandalone().catch(function (error) {
      // make it not crash when the backend service is not updated.
      // eslint-disable-next-line no-console
      console.warn(
        "request runtime api from api-gateway failed: ",
        error,
        ", something might went wrong running standalone micro app"
      );
      return;
    }),
  ];
  if (!window.NO_AUTH_GUARD) {
    let matches: string[] | null;
    const appId =
      window.APP_ID ||
      (window.APP_ROOT &&
      (matches = window.APP_ROOT.match(
        /^(?:(?:\/next)?\/)?sa-static\/([^/]+)\/versions\//
      ))
        ? matches[1]
        : null);
    if (appId) {
      // No need to wait.
      safeGetRuntimeMicroAppStandalone(appId);
    }
  }
  const [bootstrapResult, confString, runtimeData] = await Promise.all(
    requests
  );
  let conf: StandaloneConf;
  try {
    conf = confString
      ? (yaml.safeLoad(confString, {
          schema: yaml.JSON_SCHEMA,
          json: true,
        }) as StandaloneConf)
      : undefined;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Parse conf.yaml failed", error);
    throw new Error("Invalid conf.yaml");
  }
  let settings: Settings;
  if (conf) {
    const { sys_settings, user_config, user_config_by_apps } = conf;
    if (sys_settings) {
      const { feature_flags: featureFlags, ...rest } = sys_settings;
      settings = {
        featureFlags,
        ...rest,
      } as Settings;
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
  if (runtimeData) {
    const runtimeSettings = runtimeData.settings as Settings;
    if (!isEmpty(runtimeSettings)) {
      // Merge Feature Flags
      if (!settings) {
        settings = runtimeSettings;
      } else {
        // Merge Feature Flags & Misc
        const { featureFlags, misc, ...rest } = runtimeSettings;
        settings.featureFlags = {
          ...settings.featureFlags,
          ...runtimeSettings.featureFlags,
        };
        settings.misc = {
          ...settings.misc,
          ...runtimeSettings.misc,
        };
        settings = Object.assign(settings, rest);
      }
    }
  }
  return {
    ...bootstrapResult,
    settings,
  };
}

const appRuntimeDataMap = new Map<
  string,
  Promise<RuntimeApi_RuntimeMicroAppStandaloneResponseBody | void>
>();

export async function safeGetRuntimeMicroAppStandalone(
  appId: string
): Promise<RuntimeApi_RuntimeMicroAppStandaloneResponseBody | void> {
  if (appRuntimeDataMap.has(appId)) {
    return appRuntimeDataMap.get(appId);
  }
  const promise = RuntimeApi_runtimeMicroAppStandalone(appId).catch(function (
    error
  ) {
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
