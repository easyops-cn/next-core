import type {
  RuntimeStoryboard,
  BootstrapSettings,
  FeatureFlags,
  BootstrapData,
} from "@next-core/types";
import { i18n, initializeI18n } from "@next-core/i18n";
import moment from "moment";
import "moment/locale/zh-cn.js";
import { createHistory } from "../history.js";
import { matchStoryboard } from "./matchStoryboard.js";
import { Router } from "./Router.js";
import { loadCheckLogin } from "./loadCheckLogin.js";
import { loadBootstrapData } from "./loadBootstrapData.js";

let runtime: Runtime;

let bootstrapData: Partial<BootstrapData> | undefined;
let router!: Router;

export function createRuntime() {
  if (runtime) {
    throw new Error("Cannot create multiple runtimes");
  }
  initializeI18n();
  moment.locale(i18n.language);
  i18n.on("languageChanged", () => {
    moment.locale(i18n.language);
  });
  createHistory();
  runtime = new Runtime();
  return runtime;
}

export function getRuntime() {
  return runtime;
}

export class Runtime {
  async bootstrap() {
    const [, _bootstrapData] = await Promise.all([
      loadCheckLogin(),
      loadBootstrapData(),
    ]);
    bootstrapData = _bootstrapData;
    router = new Router(_bootstrapData.storyboards);
    await router.bootstrap();
  }

  getRecentApps() {
    return router.getRecentApps();
  }

  getCurrentApp() {
    return router.getRecentApps().currentApp;
  }

  getFeatureFlags(): FeatureFlags {
    return {
      ...bootstrapData?.settings?.featureFlags,
      ...(
        router.getRecentApps().currentApp?.config?.settings as BootstrapSettings
      )?.featureFlags,
      "migrate-to-brick-next-v3": true,
    };
  }

  getMiscSettings() {
    return {
      ...bootstrapData?.settings?.misc,
      ...(
        router.getRecentApps().currentApp?.config?.settings as BootstrapSettings
      )?.misc,
    };
  }

  getBrandSettings(): Record<string, string> {
    return {
      base_title: "DevOps 管理专家",
      ...(bootstrapData?.settings?.brand as Record<string, string>),
      // ...(kernel.getOriginFaviconHref()
      //   ? { favicon: kernel.getOriginFaviconHref() }
      //   : {})
    };
  }

  getLaunchpadSettings() {
    return {
      columns: 7,
      rows: 4,
      ...bootstrapData?.settings?.launchpad,
    };
  }

  getDesktops(): unknown[] {
    return bootstrapData?.desktops ?? [];
  }

  getLaunchpadSiteMap(): unknown[] {
    return bootstrapData?.siteSort ?? [];
  }

  toggleLaunchpadEffect(open: boolean): void {
    document.body.classList.toggle("launchpad-open", open);
  }

  applyPageTitle(pageTitle: string): void {
    const baseTitle = this.getBrandSettings().base_title;
    document.title = pageTitle ? `${pageTitle} - ${baseTitle}` : baseTitle;
  }

  getNavConfig() {
    return router.getNavConfig();
  }
}

export function _internalApiSetBootstrapData(data: Partial<BootstrapData>) {
  bootstrapData = data;
}

export function getBrickPackages() {
  return bootstrapData?.brickPackages ?? [];
}

export function _internalApiGetRenderId(): string | undefined {
  return router.getRenderId();
}

export function _internalApiMatchStoryboard(
  pathname: string
): RuntimeStoryboard | undefined {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  return matchStoryboard(bootstrapData?.storyboards ?? [], pathname);
}

export function _internalApiGetRuntimeContext() {
  return router?.getRuntimeContext();
}

export function _internalApiGetStoryboardInBootstrapData(appId: string) {
  return bootstrapData?.storyboards?.find(
    (storyboard) => storyboard.app.id === appId
  );
}

export function _internalApiGetAppInBootstrapData(appId: string) {
  return _internalApiGetStoryboardInBootstrapData(appId)?.app;
}
