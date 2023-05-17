import type {
  RuntimeStoryboard,
  BootstrapSettings,
  FeatureFlags,
  BootstrapData,
} from "@next-core/types";
import { i18n, initializeI18n } from "@next-core/i18n";
import { loadBricksImperatively } from "@next-core/loader";
import { deepFreeze, isObject } from "@next-core/utils/general";
import moment from "moment";
import "moment/locale/zh-cn.js";
import { createHistory } from "../history.js";
import { matchStoryboard } from "./matchStoryboard.js";
import { Router } from "./Router.js";
import { NS, locales } from "./i18n.js";
import { loadNotificationService } from "../Notification.js";
import { loadDialogService } from "../Dialog.js";
import { injectedBrickPackages } from "./injected.js";

let runtime: Runtime;

// Allow inject bootstrap data in a runtime other than Brick Next.
let bootstrapData: BootstrapData | undefined;
let router: Router | undefined;

export interface RuntimeOptions {
  hooks?: RuntimeHooks;
}

export interface RuntimeHooks {
  fulfilStoryboard?: (storyboard: RuntimeStoryboard) => Promise<void>;
}

export let hooks: RuntimeHooks | undefined;

export function createRuntime(options?: RuntimeOptions) {
  if (runtime) {
    throw new Error("Cannot create multiple runtimes");
  }
  hooks = options?.hooks;
  initializeI18n(NS, locales);
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
  #initialized = false;
  #bootstrapped = false;

  initialize(data: BootstrapData) {
    if (this.#initialized) {
      throw new Error("The runtime cannot be initialized more than once");
    }
    this.#initialized = true;
    normalizeBootstrapData(data);
    bootstrapData = data;
    const { notification, dialog } = (data.settings?.presetBricks ?? {}) as {
      notification?: string | false;
      dialog?: string | false;
    };
    if (notification !== false) {
      loadNotificationService(
        notification ?? "shoelace.show-notification",
        this.loadBricks
      );
    }
    if (dialog !== false) {
      loadDialogService(dialog ?? "shoelace.show-dialog", this.loadBricks);
    }
  }

  async bootstrap(data?: BootstrapData) {
    if (data) {
      this.initialize(data);
    }
    if (this.#bootstrapped) {
      throw new Error("The runtime cannot be bootstrapped more than once");
    }
    this.#bootstrapped = true;
    router = new Router(bootstrapData!.storyboards!);
    await router.bootstrap();
  }

  getRecentApps() {
    return router?.getRecentApps() ?? {};
  }

  getCurrentApp() {
    return router?.getRecentApps().currentApp;
  }

  getFeatureFlags(): FeatureFlags {
    return {
      ...bootstrapData?.settings?.featureFlags,
      ...(
        router?.getRecentApps().currentApp?.config
          ?.settings as BootstrapSettings
      )?.featureFlags,
      "migrate-to-brick-next-v3": true,
    };
  }

  getMiscSettings() {
    return {
      ...bootstrapData?.settings?.misc,
      ...(
        router?.getRecentApps().currentApp?.config
          ?.settings as BootstrapSettings
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
    return router?.getNavConfig();
  }

  loadBricks(bricks: string[] | Set<string>) {
    return loadBricksImperatively(bricks, getBrickPackages());
  }
}

function normalizeBootstrapData(data: BootstrapData) {
  if (Array.isArray(data.storyboards)) {
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
  }
  if (isObject(data.settings)) {
    deepFreeze(data.settings);
  }
  if (data.brickPackages) {
    deepFreeze(data.brickPackages);
  }
}

export function getBrickPackages() {
  return bootstrapData?.brickPackages ?? injectedBrickPackages;
}

export function _internalApiLoadBricks(bricks: string[] | Set<string>) {
  return loadBricksImperatively(bricks, getBrickPackages());
}

export function _internalApiGetRenderId(): string | undefined {
  return router?.getRenderId();
}

export function _internalApiMatchStoryboard(
  pathname: string
): RuntimeStoryboard | undefined {
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

export let _test_only_setBootstrapData: (data: BootstrapData) => void;

if (process.env.NODE_ENV === "test") {
  _test_only_setBootstrapData = (data) => {
    bootstrapData = data as BootstrapData;
  };
}
