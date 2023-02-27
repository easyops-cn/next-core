import {
  BootstrapV2Api_bootstrapV2,
  BootstrapV2Api_getAppStoryboardV2,
} from "@next-api-sdk/api-gateway-sdk";
import { http } from "@next-core/http";
import type { BootstrapData, RuntimeStoryboard } from "@next-core/types";
import { registerAppI18n } from "./registerAppI18n.js";

export async function loadBootstrapData(): Promise<BootstrapData> {
  return window.STANDALONE_MICRO_APPS
    ? standaloneBootstrap()
    : (BootstrapV2Api_bootstrapV2({}) as Promise<BootstrapData>);
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

  postProcessStoryboard(storyboard);
}

function postProcessStoryboard(storyboard: RuntimeStoryboard) {
  // Todo
  registerAppI18n(storyboard);
}
