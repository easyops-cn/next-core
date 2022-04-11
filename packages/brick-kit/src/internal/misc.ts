import { RuntimeMisc } from "@next-core/brick-types";
import { getBasePath } from "./getBasePath";

let misc: RuntimeMisc;

export function getRuntimeMisc(): RuntimeMisc {
  if (!misc) {
    misc = {
      isInIframe: false,
      isInIframeOfLegacyConsole: false,
    };

    if (window !== window.parent) {
      misc.isInIframe = true;
      try {
        // Handle when previewing in visual builder by iframe.
        misc.isInIframeOfLegacyConsole =
          window.origin === window.parent.origin &&
          getBasePath() === "/next/" &&
          !window.parent.location.pathname.startsWith("/next/");
      } catch (e) {
        // do nothing
      }
    }

    Object.freeze(misc);
  }

  return misc;
}
