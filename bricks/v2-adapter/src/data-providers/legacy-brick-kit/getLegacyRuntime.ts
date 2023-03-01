import { customProcessors, getRuntime } from "@next-core/runtime";
import { registerLazyBricks } from "./LazyBrickRegistry.js";

export function getLegacyRuntime() {
  return {
    getFeatureFlags() {
      return getRuntime().getFeatureFlags();
    },
    registerCustomProcessor(
      ...args: Parameters<typeof customProcessors.define>
    ) {
      return customProcessors.define(...args);
    },
    registerLazyBricks,
  };
}
