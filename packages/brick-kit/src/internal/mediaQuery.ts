import EventTarget from "@ungap/event-target";

export interface Media {
  size?: MediaSize;
}

export enum MediaSize {
  xLarge = "xLarge",
  large = "large",
  medium = "medium",
  small = "small",
  xSmall = "xSmall",
}

export const mediaSizeBreakpointMap = new Map<MediaSize, string | number>([
  [MediaSize.xLarge, "1920px"],
  [MediaSize.large, "1600px"],
  [MediaSize.medium, "1280px"],
  [MediaSize.small, "1024px"],
  [MediaSize.xSmall, 0],
]);
export const mediaEventTarget = new EventTarget();

const sizeMatchesMap: Partial<Record<MediaSize, boolean>> = {};
const MEDIA: Media = {};

function handleMatchesChange(
  data: { readonly matches: boolean; readonly media: string },
  size: MediaSize
): void {
  let changed = false;
  sizeMatchesMap[size] = data.matches;

  for (const [size] of mediaSizeBreakpointMap) {
    if (sizeMatchesMap[size] && MEDIA.size !== size) {
      MEDIA.size = size;
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

mediaSizeBreakpointMap.forEach((breakpoint, size) => {
  const mediaQueryList = window.matchMedia(`(min-width: ${breakpoint})`);

  handleMatchesChange(mediaQueryList, size);

  if (mediaQueryList.addEventListener) {
    mediaQueryList.addEventListener("change", (event) => {
      handleMatchesChange(event, size);
    });
  } else {
    mediaQueryList.addListener((event) => {
      handleMatchesChange(event, size);
    });
  }
});

export const getMedia = (): Media => MEDIA;
