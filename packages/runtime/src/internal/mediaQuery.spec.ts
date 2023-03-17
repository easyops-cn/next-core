import {
  getMedia,
  mediaEventTarget,
  mediaBreakpointMinWidthMap,
} from "./mediaQuery.js";

const matchMediaMockResults = (window.matchMedia as jest.Mock).mock.results;
const mediaBreakpoints = [...mediaBreakpointMinWidthMap.keys()];
const listeners = mediaBreakpoints.map((breakpoint, index) => {
  return matchMediaMockResults[index].value.addEventListener.mock.calls[0][1];
}) as Function[];

describe("mediaQuery", () => {
  it("should work", () => {
    const handler = jest.fn();
    expect(getMedia()).toEqual({ breakpoint: "xLarge" });
    mediaEventTarget.addEventListener("change", handler);

    const mediaBreakpoints = [...mediaBreakpointMinWidthMap.keys()];
    mediaBreakpoints.forEach((breakpoint, index) => {
      const nextBreakpoint = mediaBreakpoints[index + 1];

      if (nextBreakpoint) {
        listeners[index]({
          matches: false,
        });
        const newMedia = { breakpoint: nextBreakpoint };
        expect(getMedia()).toEqual(newMedia);
        expect(handler).lastCalledWith(
          expect.objectContaining({
            detail: newMedia,
          })
        );
      }
    });
  });
});
