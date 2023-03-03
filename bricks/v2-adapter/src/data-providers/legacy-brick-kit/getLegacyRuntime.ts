import {
  customProcessors,
  customTemplates,
  getBasePath,
  getRuntime,
} from "@next-core/runtime";
import type {
  CustomTemplateConstructor,
  CustomTemplateProxyBasicProperty,
  FeatureFlags,
} from "@next-core/types";
import { registerLazyBricks } from "./LazyBrickRegistry.js";

interface LegacyTplPropProxy extends CustomTemplateProxyBasicProperty {
  asVariable?: boolean;
  mergeProperty?: unknown;
  refTransform?: unknown;
}

export function getLegacyRuntime(): {
  getFeatureFlags(): FeatureFlags;
  applyPageTitle(pageTitle: string): void;
} {
  return new Proxy(getRuntime(), {
    get(...args) {
      // const key = args[1] as keyof ReturnType<typeof getRuntime>;
      const key = args[1];
      switch (key) {
        case "getCurrentApp":
        case "getDesktops":
        case "getLaunchpadSettings":
        case "getLaunchpadSiteMap":
        case "toggleLaunchpadEffect":
        case "applyPageTitle":
          return Reflect.get(...args);
        case "getFeatureFlags":
        case "getMiscSettings":
        case "getBrandSettings": {
          const fn = Reflect.get(...args);
          return function (...params: unknown[]) {
            // These methods requires bootstrap, which is not available in playground.
            return catchWithFallback(fn, params, {});
          };
        }
        case "registerCustomTemplate":
          return registerCustomTemplate;
        case "registerCustomProcessor":
          return registerCustomProcessor;
        case "registerLazyBricks":
          return registerLazyBricks;
        case "getBasePath":
          return getBasePath;
        case "getCurrentRoute":
          return getCurrentRoute;
        case "getMicroApps":
          return function getMicroApps() {
            return [];
          };
        case "reloadMicroApps":
          return function reloadMicroApps() {
            //
          };
      }
    },
  });
}

function registerCustomTemplate(
  tagName: string,
  constructor: CustomTemplateConstructor
) {
  const props = constructor.proxy?.properties as {
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
}

function registerCustomProcessor(
  ...args: Parameters<typeof customProcessors.define>
) {
  return customProcessors.define(...args);
}

function getCurrentRoute() {
  // eslint-disable-next-line no-console
  console.error("`getRuntime().getCurrentRoute()` is not supported in v3");
  return null;
}

function catchWithFallback(fn: Function, args: unknown[], fallback: unknown) {
  try {
    return fn(...args);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(error);
    return fallback;
  }
}
