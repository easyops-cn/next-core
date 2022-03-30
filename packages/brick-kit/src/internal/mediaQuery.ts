import EventTarget from "@ungap/event-target";

export interface Media {
  breakpoint?: MediaBreakpoint;
}

export enum MediaBreakpoint {
  xLarge = "xLarge",
  large = "large",
  medium = "medium",
  small = "small",
  xSmall = "xSmall",
}

export const mediaBreakpointMinWidthMap = new Map<
  MediaBreakpoint,
  string | number
>([
  [MediaBreakpoint.xLarge, "1920px"],
  [MediaBreakpoint.large, "1600px"],
  [MediaBreakpoint.medium, "1280px"],
  [MediaBreakpoint.small, "1024px"],
  [MediaBreakpoint.xSmall, 0],
]);
export const mediaEventTarget = new EventTarget();

const breakpointMatchesMap: Partial<Record<MediaBreakpoint, boolean>> = {};
const MEDIA: Media = {};

function handleMatchesChange(
  data: { readonly matches: boolean; readonly media: string },
  breakpoint: MediaBreakpoint
): void {
  let changed = false;
  breakpointMatchesMap[breakpoint] = data.matches;

  for (const [breakpoint] of mediaBreakpointMinWidthMap) {
    if (breakpointMatchesMap[breakpoint] && MEDIA.breakpoint !== breakpoint) {
      MEDIA.breakpoint = breakpoint;
      changed = true;
      break;
    }
  }

  if (changed) {
    mediaEventTarget.dispatchEvent(
      new CustomEvent("change", { detail: MEDIA })
    );
  }
}

mediaBreakpointMinWidthMap.forEach((minWidth, breakpoint) => {
  const mediaQueryList = window.matchMedia(`(min-width: ${minWidth})`);

  handleMatchesChange(mediaQueryList, breakpoint);

  if (mediaQueryList.addEventListener) {
    mediaQueryList.addEventListener("change", (event) => {
      handleMatchesChange(event, breakpoint);
    });
  } else {
    mediaQueryList.addListener((event) => {
      handleMatchesChange(event, breakpoint);
    });
  }
});

export const getMedia = (): Media => MEDIA;
