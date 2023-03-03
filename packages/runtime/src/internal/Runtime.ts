import type { RuntimeStoryboard, BootstrapSettings } from "@next-core/types";
import { i18n, initializeI18n } from "@next-core/i18n";
import moment from "moment";
import "moment/locale/zh-cn.js";
import { createHistory } from "../history.js";
import { Kernel } from "./Kernel.js";
import { matchStoryboard } from "./matchStoryboard.js";

let kernel: Kernel;
let runtime: Runtime;

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
  bootstrap() {
    kernel = new Kernel();
    return kernel.bootstrap();
  }

  getRecentApps() {
    return kernel.router.getRecentApps();
  }

  getFeatureFlags() {
    return {
      ...kernel.bootstrapData.settings?.featureFlags,
      ...(
        kernel.router.getRecentApps().currentApp?.config
          ?.settings as BootstrapSettings
      )?.featureFlags,
    };
  }

  getMiscSettings() {
    return {
      ...kernel.bootstrapData.settings?.misc,
      ...(
        kernel.router.getRecentApps().currentApp?.config
          ?.settings as BootstrapSettings
      )?.misc,
    };
  }

  getBrandSettings(): Record<string, string> {
    return {
      base_title: "DevOps 管理专家",
      ...(kernel.bootstrapData.settings?.brand as Record<string, string>),
      // ...(kernel.getOriginFaviconHref()
      //   ? { favicon: kernel.getOriginFaviconHref() }
      //   : {})
    };
  }

  getLaunchpadSettings() {
    return {
      columns: 7,
      rows: 4,
      ...(kernel.bootstrapData.settings?.launchpad as {
        columns?: number;
        rows?: number;
      }),
    };
  }

  getDesktops(): unknown[] {
    return (kernel.bootstrapData as any).desktops || [];
  }

  getLaunchpadSiteMap(): unknown[] {
    return (kernel.bootstrapData as any).siteSort || [];
  }

  toggleLaunchpadEffect(open: boolean): void {
    document.body.classList.toggle("launchpad-open", open);
  }

  applyPageTitle(pageTitle: string): void {
    const baseTitle = this.getBrandSettings().base_title;
    document.title = pageTitle ? `${pageTitle} - ${baseTitle}` : baseTitle;
  }
}

/* istanbul ignore next */
export function _internalApiGetRenderId(): string | undefined {
  if (process.env.NODE_ENV === "test") {
    return "render-id-1";
  }
  return kernel.router.getRenderId();
}

/* istanbul ignore next */
export function _internalApiMatchStoryboard(
  pathname: string
): RuntimeStoryboard | undefined {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  return matchStoryboard(kernel.bootstrapData.storyboards, pathname);
}

/* istanbul ignore next */
export function _internalApiGetRuntimeContext() {
  return kernel?.router.getRuntimeContext();
}
