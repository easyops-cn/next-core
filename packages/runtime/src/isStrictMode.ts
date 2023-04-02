import { getRuntime } from "./index.js";
import type { RuntimeContext } from "./internal/interfaces.js";

export function isStrictMode(runtimeContext?: RuntimeContext) {
  return !!(
    runtimeContext ? runtimeContext.flags : getRuntime()?.getFeatureFlags()
  )?.["brick-next-v3-strict-mode"];
}

export function warnAboutStrictMode(
  strict: boolean,
  message: string,
  ...extraLogs: unknown[]
) {
  const punctuation = extraLogs.length === 0 ? "" : ",";
  if (strict) {
    // eslint-disable-next-line no-console
    console.error(
      `${message} is dropped in v3 strict mode${punctuation}`,
      ...extraLogs
    );
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      `${message} is deprecated in v3 and will be dropped in strict mode${punctuation}`,
      ...extraLogs
    );
  }
}
