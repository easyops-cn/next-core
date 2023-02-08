import { getBasePath } from "./getBasePath.js";

let misc: PageInfo;

/** 运行时页面信息。*/
export interface PageInfo {
  /** 当前是否处于 iframe 模式。 */
  isInIframe: boolean;

  /** 当前是否处于同域的 iframe 模式。 */
  isInIframeOfSameSite: boolean;

  /** 当前是否处于新框架下的 iframe 模式。 */
  isInIframeOfNext: boolean;

  /** 当前是否处于 Visual Builder 预览的 iframe 模式。 */
  isInIframeOfVisualBuilder: boolean;

  /** 当前是否处于老 console 下的 iframe 模式。 */
  isInIframeOfLegacyConsole: boolean;
}

export function getPageInfo(): PageInfo {
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
