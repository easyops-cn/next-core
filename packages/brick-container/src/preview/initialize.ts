import { getRuntime } from "@next-core/brick-kit";

let initialized = false;
const LOCALHOST_REG_EXP = /^https?:\/\/localhost(?:$|:)/;

export default async function initialize(
  bootstrap: Promise<"ok" | "failed">,
  previewFromOrigin: string
): Promise<boolean> {
  if (initialized || !previewFromOrigin) {
    return false;
  }
  const bootstrapStatus = await bootstrap;
  if (bootstrapStatus === "failed") {
    return false;
  }
  initialized = true;

  // Make sure preview from the expected origins.
  let previewAllowed =
    previewFromOrigin === location.origin ||
    LOCALHOST_REG_EXP.test(previewFromOrigin) ||
    LOCALHOST_REG_EXP.test(location.origin);
  if (!previewAllowed) {
    const { allowedPreviewFromOrigins } = getRuntime().getMiscSettings() as {
      allowedPreviewFromOrigins?: string[];
    };
    if (Array.isArray(allowedPreviewFromOrigins)) {
      previewAllowed = allowedPreviewFromOrigins.some(
        (origin) => origin === previewFromOrigin
      );
    }
    if (!previewAllowed) {
      // eslint-disable-next-line
      console.error(
        `Preview is disallowed, from origin: ${previewFromOrigin}, while allowing: ${JSON.stringify(
          allowedPreviewFromOrigins
        )}`
      );
    }
  }
  return previewAllowed;
}
