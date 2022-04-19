import type { RuntimeMisc } from "@next-core/brick-types";
import { getBasePath } from "./getBasePath";

let misc: RuntimeMisc;

export function getRuntimeMisc(): RuntimeMisc {
  if (!misc) {
    misc = {
      isInIframe: false,
      isInIframeOfSameSite: false,
      isInIframeOfNext: false,
      isInIframeOfVisualBuilder: false,
      isInIframeOfLegacyConsole: false,
    };

    if (window !== window.parent) {
      misc.isInIframe = true;
      try {
        // Handle:
        // - Previewing in visual builder by iframe.
        // - Nesting next in next.
        // - Nesting console in next.
        if (window.origin === window.parent.origin) {
          misc.isInIframeOfSameSite = true;
          const selfIsNext = getBasePath() === "/next/";
          const parentPathname = window.parent.location.pathname;
          const parentIsNext = parentPathname.startsWith("/next/");
          misc.isInIframeOfNext =
            (Number(selfIsNext) ^ Number(parentIsNext)) === 0;
          misc.isInIframeOfVisualBuilder = parentPathname.startsWith(
            `${parentIsNext ? "/next" : ""}/visual-builder/`
          );
          misc.isInIframeOfLegacyConsole = selfIsNext && !parentIsNext;
        }
      } catch (e) {
        // do nothing
      }
    }

    Object.freeze(misc);
  }

  return misc;
}
