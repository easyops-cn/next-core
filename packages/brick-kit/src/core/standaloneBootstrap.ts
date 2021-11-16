import yaml from "js-yaml";
import { http } from "@next-core/brick-http";
import { BootstrapData, Settings } from "@next-core/brick-types";
import { hasOwnProperty } from "@next-core/brick-utils";

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
  const [bootstrapResult, confString] = await Promise.all([
    http.get<BootstrapData>(window.BOOTSTRAP_FILE),
    http.get<string>("conf.yaml", {
      responseType: "text",
    }),
  ]);
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
  return {
    ...bootstrapResult,
    settings,
  };
}
