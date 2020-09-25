import { RuntimeMisc } from "@easyops/brick-types";

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
        misc.isInIframeOfLegacyConsole = window.origin === window.parent.origin;
      } catch (e) {
        // do nothing
      }
    }

    Object.freeze(misc);
  }

  return misc;
}
