import { isEmpty } from "lodash";
import {
  BootstrapStandaloneApi_runtimeStandalone,
  BootstrapV2Api_getBricksInfo,
} from "@next-sdk/api-gateway-sdk";
import { Settings, RuntimeBootstrapData } from "@next-core/brick-types";

export async function getPreviewBootstrap(): Promise<RuntimeBootstrapData> {
  const [runtimeData, previewPackageData] = await Promise.all([
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
    BootstrapV2Api_getBricksInfo({}),
  ]);

  const result = {
    storyboards: [],
    microApps: [],
  } as RuntimeBootstrapData;

  if (runtimeData) {
    const runtimeSettings = runtimeData.settings as Settings;
    if (!isEmpty(runtimeSettings)) {
      Object.assign(result, {
        settings: runtimeSettings,
      });
    }
  }

  if (previewPackageData) {
    Object.assign(result, {
      brickPackages: previewPackageData.bricksInfo ?? [],
      templatePackages: previewPackageData.templatesInfo ?? [],
    });
  }

  return result;
}
