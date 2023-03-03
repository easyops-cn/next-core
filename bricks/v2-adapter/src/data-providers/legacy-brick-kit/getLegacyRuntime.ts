import {
  customProcessors,
  customTemplates,
  getBasePath,
  getRuntime,
} from "@next-core/runtime";
import type {
  CustomTemplateConstructor,
  CustomTemplateProxyBasicProperty,
} from "@next-core/types";
import { registerLazyBricks } from "./LazyBrickRegistry.js";

interface LegacyTplPropProxy extends CustomTemplateProxyBasicProperty {
  asVariable?: boolean;
  mergeProperty?: unknown;
  refTransform?: unknown;
}

export function getLegacyRuntime() {
  return {
    getFeatureFlags() {
      return catchWithFallback(() => getRuntime().getFeatureFlags(), {});
    },
    getMiscSettings() {
      return getRuntime().getMiscSettings();
    },
    getBrandSettings() {
      return getRuntime().getBrandSettings();
    },
    registerCustomTemplate(
      tagName: string,
      constructor: CustomTemplateConstructor
    ) {
      const props = constructor.proxy?.properties as
        | undefined
        | {
            [name: string]: LegacyTplPropProxy;
          };
      const validProps: [string, CustomTemplateProxyBasicProperty][] = [];
      const tplVariables: string[] = [];
      if (props) {
        for (const [key, value] of Object.entries(props)) {
          if (value.asVariable) {
            // For existed TPL usage, treat it as a STATE.
            tplVariables.push(key);
            // eslint-disable-next-line no-console
            console.warn(
              "Template `asVariable` with `TPL.*` is deprecated and will be dropped in v3:",
              tagName,
              key
            );
          } else if (value.mergeProperty || value.refTransform) {
            // eslint-disable-next-line no-console
            console.error(
              "Template `mergeProperty` and `refTransform` are not supported in v3:",
              tagName,
              key
            );
          } else {
            validProps.push([key, value]);
          }
        }
      }
      return customTemplates.define(tagName, {
        ...constructor,
        proxy: {
          ...constructor.proxy,
          properties: Object.fromEntries(validProps),
        },
        state: (constructor.state
          ? constructor.state.map((item) => ({
              // For existed templates, make `expose` defaults to true.
              expose: true,
              ...item,
            }))
          : []
        ).concat(tplVariables.map((tpl) => ({ name: tpl, expose: true }))),
      });
    },
    registerCustomProcessor(
      ...args: Parameters<typeof customProcessors.define>
    ) {
      return customProcessors.define(...args);
    },
    registerLazyBricks,
    getBasePath,
    getCurrentApp() {
      return getRuntime().getRecentApps().currentApp;
    },
    getCurrentRoute() {
      // eslint-disable-next-line no-console
      console.error("`getRuntime().getCurrentRoute()` is not supported in v3");
      return null;
    },

    // Launchpad
    getDesktops() {
      return getRuntime().getDesktops();
    },
    getMicroApps() {
      return [];
    },
    getLaunchpadSettings() {
      return getRuntime().getLaunchpadSettings();
    },
    getLaunchpadSiteMap() {
      return getRuntime().getLaunchpadSiteMap();
    },
    toggleLaunchpadEffect(open: boolean) {
      return getRuntime().toggleLaunchpadEffect(open);
    },
    reloadMicroApps() {
      //
    },
    applyPageTitle(pageTitle: string) {
      return getRuntime().applyPageTitle(pageTitle);
    },
  };
}

function catchWithFallback(fn: Function, fallback: unknown) {
  try {
    return fn();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(error);
    return fallback;
  }
}
