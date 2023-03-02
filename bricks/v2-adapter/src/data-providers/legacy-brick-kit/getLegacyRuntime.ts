import { customProcessors, getRuntime } from "@next-core/runtime";
import { registerLazyBricks } from "./LazyBrickRegistry.js";

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
    registerCustomProcessor(
      ...args: Parameters<typeof customProcessors.define>
    ) {
      return customProcessors.define(...args);
    },
    registerLazyBricks,

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
